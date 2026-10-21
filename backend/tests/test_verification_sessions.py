"""Verification d'email, revocation des sessions, fuseau des entretiens, pagination."""

import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from app.core.config import settings
from app.core.migrations_legeres import appliquer_migrations_legeres
from app.core.reset_tokens import creer_token_verif
from app.models.notification import Notification
from app.models.user import User


def _data(type_profil="entreprise", email="ent@example.com", nom="Test"):
    return {
        "nom": nom,
        "email": email,
        "mot_de_passe": "motdepasse123",
        "type_profil": type_profil,
        "consentement": True,
        "consent_version": "2026-09-06",
    }


def _login(client, data):
    client.post("/api/auth/register", json=data)
    r = client.post(
        "/api/auth/login",
        json={"email": data["email"], "mot_de_passe": data["mot_de_passe"]},
    )
    assert r.status_code == 200, r.text
    client.cookies.clear()
    return r.json()


def _h(login):
    return {"Authorization": f"Bearer {login['access_token']}"}


def _user(db_session, email):
    db_session.expire_all()
    return db_session.query(User).filter(User.email == email).first()


# ---------- verification d'email ----------
def test_entreprise_non_verifiee_bloquee_puis_debloquee(client, db_session, monkeypatch):
    monkeypatch.setattr(settings, "require_email_verification", True)
    h = _h(_login(client, _data()))
    client.put("/api/profiles/me", headers=h, json={"secteur": "Tech"})
    offre = {"titre": "Stage Python", "type_contrat": "stage"}

    assert client.post("/api/offres", headers=h, json=offre).status_code == 403
    assert client.get("/api/talents", headers=h).status_code == 403

    token = creer_token_verif(_user(db_session, "ent@example.com"))
    assert client.post("/api/auth/verify-email", json={"token": token}).status_code == 200
    assert client.post("/api/offres", headers=h, json=offre).status_code == 201
    assert client.get("/api/talents", headers=h).status_code == 200
    # lien reutilisable sans effet de bord
    assert client.post("/api/auth/verify-email", json={"token": token}).status_code == 200


def test_etudiant_jamais_bloque_par_la_verification(client, monkeypatch):
    monkeypatch.setattr(settings, "require_email_verification", True)
    h = _h(_login(client, _data("etudiant", "etu@example.com", "Aminata")))
    assert client.get("/api/offres/recommandees", headers=h).status_code == 200


def test_jeton_de_verification_invalide(client):
    assert client.post("/api/auth/verify-email", json={"token": "nimporte"}).status_code == 400
    h = _h(_login(client, _data()))
    acces = h["Authorization"].split(" ", 1)[1]
    assert client.post("/api/auth/verify-email", json={"token": acces}).status_code == 400


def test_changement_email_remet_non_verifie(client, db_session):
    h = _h(_login(client, _data("etudiant", "etu@example.com", "Aminata")))
    token = creer_token_verif(_user(db_session, "etu@example.com"))
    client.post("/api/auth/verify-email", json={"token": token})
    assert client.get("/api/auth/me", headers=h).json()["email_verifie"] is True

    r = client.patch("/api/users/me", headers=h, json={"email": "nouveau@example.com"})
    assert r.status_code == 200, r.text
    assert client.get("/api/auth/me", headers=h).json()["email_verifie"] is False
    # l'ancien lien ne marche plus pour la nouvelle adresse
    assert client.post("/api/auth/verify-email", json={"token": token}).status_code == 400


def test_renvoyer_le_lien(client):
    h = _h(_login(client, _data()))
    assert client.post("/api/auth/resend-verification", headers=h).status_code == 200
    assert client.post("/api/auth/resend-verification").status_code == 401


# ---------- sessions ----------
def test_deconnexion_revoque_les_jetons(client):
    session = _login(client, _data())
    h = _h(session)
    assert client.get("/api/auth/me", headers=h).status_code == 200

    r = client.post("/api/auth/logout", headers=h, json={"refresh_token": session["refresh_token"]})
    assert r.status_code == 200, r.text
    client.cookies.clear()
    assert client.get("/api/auth/me", headers=h).status_code == 401
    r = client.post("/api/auth/refresh", json={"refresh_token": session["refresh_token"]})
    assert r.status_code == 401


def test_deconnexion_sans_corps_fonctionne(client):
    h = _h(_login(client, _data()))
    assert client.post("/api/auth/logout", headers=h).status_code == 200
    client.cookies.clear()
    assert client.get("/api/auth/me", headers=h).status_code == 401


def test_changement_mot_de_passe_coupe_les_anciennes_sessions(client):
    session = _login(client, _data())
    ancien = _h(session)
    time.sleep(1.2)  # les jetons portent une date a la seconde

    corps = {"ancien_mot_de_passe": "motdepasse123", "nouveau_mot_de_passe": "nouveaumdp456"}
    r = client.post("/api/auth/change-password", headers=ancien, json=corps)
    assert r.status_code == 200, r.text
    nouveaux = r.json()
    client.cookies.clear()

    assert client.get("/api/auth/me", headers=ancien).status_code == 401
    r = client.post("/api/auth/refresh", json={"refresh_token": session["refresh_token"]})
    assert r.status_code == 401
    h = {"Authorization": f"Bearer {nouveaux['access_token']}"}
    assert client.get("/api/auth/me", headers=h).status_code == 200


# ---------- fuseau des entretiens ----------
def test_notification_entretien_dans_le_fuseau_de_l_entreprise(client, db_session):
    try:
        ZoneInfo("Africa/Lagos")
    except Exception:
        pytest.skip("base de fuseaux absente : pip install tzdata")
    h_ent = _h(_login(client, _data()))
    client.put("/api/profiles/me", headers=h_ent, json={"secteur": "Tech"})
    offre = client.post(
        "/api/offres", headers=h_ent, json={"titre": "Stage", "type_contrat": "stage"}
    )
    h_etu = _h(_login(client, _data("etudiant", "etu@example.com", "Aminata")))
    cand = client.post("/api/candidatures", headers=h_etu, json={"offre_id": offre.json()["id"]})

    midi_utc = (datetime.utcnow() + timedelta(days=3)).replace(
        hour=12, minute=0, second=0, microsecond=0
    )
    r = client.post(
        "/api/entretiens",
        headers=h_ent,
        json={
            "candidature_id": cand.json()["id"],
            "date_heure": midi_utc.isoformat(),
            "fuseau": "Africa/Lagos",
        },
    )
    assert r.status_code == 201, r.text
    assert r.json()["fuseau"] == "Africa/Lagos"
    db_session.expire_all()
    notif = (
        db_session.query(Notification)
        .filter(Notification.type_evenement == "entretien_planifie")
        .one()
    )
    assert "13:00" in notif.message and "Africa/Lagos" in notif.message


# ---------- pagination du classement ----------
def test_classement_pagine(client):
    h_ent = _h(_login(client, _data()))
    client.put("/api/profiles/me", headers=h_ent, json={"secteur": "Tech"})
    offre_id = client.post(
        "/api/offres", headers=h_ent, json={"titre": "Stage", "type_contrat": "stage"}
    ).json()["id"]
    for i in range(3):
        h = _h(_login(client, _data("etudiant", f"e{i}@example.com", f"Etu{i}")))
        assert (
            client.post("/api/candidatures", headers=h, json={"offre_id": offre_id}).status_code
            == 201
        )

    url = f"/api/candidatures/offre/{offre_id}/classees"
    assert len(client.get(url, headers=h_ent).json()) == 3
    assert len(client.get(url + "?limit=2", headers=h_ent).json()) == 2
    assert len(client.get(url + "?limit=2&offset=2", headers=h_ent).json()) == 1
    assert client.get(url + "?limit=0", headers=h_ent).status_code == 422


# ---------- migrations legeres ----------
def test_migrations_legeres_idempotentes(db_session):
    engine = db_session.get_bind()
    appliquer_migrations_legeres(engine)
    appliquer_migrations_legeres(engine)
