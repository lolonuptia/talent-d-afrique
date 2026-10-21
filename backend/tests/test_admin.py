"""Espace administrateur : droits, comptes, moderation, statistiques, journal."""

import uuid

import pytest

from app.models.admin_log import AdminLog
from app.models.notification import Notification
from app.models.offre import Offre
from app.models.user import User
from app.services.comptes_admin import promouvoir_admin


def _data(type_profil, email, nom="Test"):
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
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _admin(client, db_session, email="admin@example.com"):
    h = _login(client, _data("ecole", email, "Admin"))
    db_session.query(User).filter(User.email == email).update({User.is_admin: True})
    db_session.commit()
    return h


def _uid(db_session, email):
    db_session.expire_all()
    return str(db_session.query(User).filter(User.email == email).one().id)


def _entreprise_avec_offre(client, email="ent@example.com"):
    h = _login(client, _data("entreprise", email, "Entreprise"))
    client.put("/api/profiles/me", headers=h, json={"secteur": "Tech"})
    r = client.post(
        "/api/offres", headers=h, json={"titre": "Stage Python", "type_contrat": "stage"}
    )
    assert r.status_code == 201, r.text
    return h, r.json()["id"]


def _logs(db_session):
    db_session.expire_all()
    return db_session.query(AdminLog).order_by(AdminLog.created_at).all()


def test_acces_reserve_aux_admins(client):
    h = _login(client, _data("entreprise", "ent@example.com", "Entreprise"))
    for chemin in ("/utilisateurs", "/statistiques", "/statistiques/detail", "/logs", "/offres"):
        assert client.get(f"/api/admin{chemin}", headers=h).status_code == 403
        assert client.get(f"/api/admin{chemin}").status_code == 401


def test_liste_utilisateurs_recherche_et_pagination(client, db_session):
    h = _admin(client, db_session)
    for nom, mail in (
        ("Alice", "alice@example.com"),
        ("Bob", "bob@example.com"),
        ("Carla", "carla@example.com"),
    ):
        _login(client, _data("etudiant", mail, nom))
    url = "/api/admin/utilisateurs"
    assert len(client.get(url, headers=h).json()) == 4
    assert [u["nom"] for u in client.get(url + "?q=ali", headers=h).json()] == ["Alice"]
    assert len(client.get(url + "?q=EXAMPLE.com&limit=2", headers=h).json()) == 2
    assert len(client.get(url + "?limit=2&offset=3", headers=h).json()) == 1
    assert len(client.get(url + "?type_profil=etudiant", headers=h).json()) == 3
    assert client.get(url + "?q=%25", headers=h).json() == []


def test_filtre_par_statut(client, db_session):
    h = _admin(client, db_session)
    _login(client, _data("etudiant", "bob@example.com", "Bob"))
    h_carla = _login(client, _data("etudiant", "carla@example.com", "Carla"))
    bob = _uid(db_session, "bob@example.com")
    assert client.patch(f"/api/admin/utilisateurs/{bob}/suspendre", headers=h).status_code == 200
    assert client.delete("/api/users/me", headers=h_carla).status_code == 204

    def noms(statut):
        r = client.get(f"/api/admin/utilisateurs?statut={statut}", headers=h)
        return sorted(u["nom"] for u in r.json())

    assert noms("actifs") == ["Admin"]
    assert noms("suspendus") == ["Bob"]
    assert noms("supprimes") == ["Carla"]


def test_suspension_bloque_le_compte_et_journalise(client, db_session):
    h = _admin(client, db_session)
    h_etu = _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    uid = _uid(db_session, "etu@example.com")

    r = client.patch(f"/api/admin/utilisateurs/{uid}/suspendre?motif=spam", headers=h)
    assert r.status_code == 200, r.text
    assert client.get("/api/auth/me", headers=h_etu).status_code == 401
    r = client.post(
        "/api/auth/login", json={"email": "etu@example.com", "mot_de_passe": "motdepasse123"}
    )
    client.cookies.clear()
    assert r.status_code == 403
    [log] = _logs(db_session)
    assert log.action == "suspension_compte" and log.details == "spam"

    assert client.patch(f"/api/admin/utilisateurs/{uid}/reactiver", headers=h).status_code == 200
    r = client.post(
        "/api/auth/login", json={"email": "etu@example.com", "mot_de_passe": "motdepasse123"}
    )
    client.cookies.clear()
    assert r.status_code == 200


def test_protections_des_comptes_admin(client, db_session):
    h = _admin(client, db_session)
    moi = _uid(db_session, "admin@example.com")
    _admin(client, db_session, "admin2@example.com")
    autre = _uid(db_session, "admin2@example.com")

    assert client.patch(f"/api/admin/utilisateurs/{moi}/suspendre", headers=h).status_code == 400
    assert client.patch(f"/api/admin/utilisateurs/{autre}/suspendre", headers=h).status_code == 400
    inconnu = uuid.uuid4()
    assert (
        client.patch(f"/api/admin/utilisateurs/{inconnu}/suspendre", headers=h).status_code == 404
    )
    assert client.delete("/api/users/me", headers=h).status_code == 400
    assert _logs(db_session) == []


def test_suspension_entreprise_archive_ses_offres(client, db_session):
    h = _admin(client, db_session)
    _entreprise_avec_offre(client)
    uid = _uid(db_session, "ent@example.com")

    assert client.patch(f"/api/admin/utilisateurs/{uid}/suspendre", headers=h).status_code == 200
    assert client.get("/api/offres").json() == []
    db_session.expire_all()
    assert db_session.query(Offre).one().statut == "archivee"
    [log] = _logs(db_session)
    assert log.details == "1 offre(s) archivee(s)"


def test_compte_supprime_ni_reactivable_ni_suspendable(client, db_session):
    h = _admin(client, db_session)
    h_etu = _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    uid = _uid(db_session, "etu@example.com")
    assert client.delete("/api/users/me", headers=h_etu).status_code == 204

    assert client.patch(f"/api/admin/utilisateurs/{uid}/reactiver", headers=h).status_code == 400
    assert client.patch(f"/api/admin/utilisateurs/{uid}/suspendre", headers=h).status_code == 400


def test_verification_email_manuelle(client, db_session):
    h = _admin(client, db_session)
    _login(client, _data("entreprise", "ent@example.com", "Entreprise"))
    uid = _uid(db_session, "ent@example.com")
    assert db_session.query(User).filter(User.id == uid).one().email_verifie_at is None

    r = client.patch(f"/api/admin/utilisateurs/{uid}/verifier-email", headers=h)
    assert r.status_code == 200, r.text
    db_session.expire_all()
    assert db_session.query(User).filter(User.id == uid).one().email_verifie_at is not None
    assert [log.action for log in _logs(db_session)] == ["verification_email_manuelle"]


def test_moderation_offre_sans_candidature_supprimee(client, db_session):
    h = _admin(client, db_session)
    _, offre_id = _entreprise_avec_offre(client)

    r = client.delete(f"/api/admin/offres/{offre_id}?motif=contenu", headers=h)
    assert r.status_code == 200, r.text
    assert "supprimee" in r.json()["message"]
    assert client.get(f"/api/offres/{offre_id}").status_code == 404
    notifs = db_session.query(Notification).filter(Notification.type_evenement == "offre_moderee")
    assert notifs.count() == 1
    assert "contenu" in notifs.one().message
    assert client.delete(f"/api/admin/offres/{uuid.uuid4()}", headers=h).status_code == 404


def test_moderation_offre_avec_candidatures_archivee(client, db_session):
    h = _admin(client, db_session)
    _, offre_id = _entreprise_avec_offre(client)
    h_etu = _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    assert (
        client.post("/api/candidatures", headers=h_etu, json={"offre_id": offre_id}).status_code
        == 201
    )

    r = client.delete(f"/api/admin/offres/{offre_id}", headers=h)
    assert r.status_code == 200, r.text
    assert "archivee" in r.json()["message"]
    db_session.expire_all()
    assert db_session.query(Offre).one().statut == "archivee"
    assert len(client.get("/api/candidatures/mine", headers=h_etu).json()) == 1
    assert [log.action for log in _logs(db_session)] == ["archivage_offre_moderation"]


def test_liste_offres_moderation(client, db_session):
    h = _admin(client, db_session)
    _, offre_id = _entreprise_avec_offre(client)
    h_etu = _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    client.post("/api/candidatures", headers=h_etu, json={"offre_id": offre_id})

    lignes = client.get("/api/admin/offres", headers=h).json()
    assert len(lignes) == 1
    assert lignes[0]["titre"] == "Stage Python"
    assert lignes[0]["entreprise"] == "Entreprise"
    assert lignes[0]["candidatures"] == 1
    assert client.get("/api/admin/offres?statut=archivee", headers=h).json() == []
    assert len(client.get("/api/admin/offres?q=python", headers=h).json()) == 1
    assert client.get("/api/admin/offres?q=zzz", headers=h).json() == []


def test_statistiques_sans_comptes_supprimes(client, db_session):
    h = _admin(client, db_session)
    _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    h_del = _login(client, _data("etudiant", "etu2@example.com", "Partie"))
    _login(client, _data("entreprise", "ent@example.com", "Entreprise"))
    assert client.delete("/api/users/me", headers=h_del).status_code == 204

    g = client.get("/api/admin/statistiques", headers=h).json()
    assert g["total_utilisateurs"] == 3
    assert g["total_etudiants"] == 1
    assert g["total_ecoles"] == 1
    assert g["entreprises_non_verifiees"] == 1
    assert g["comptes_suspendus"] == 0


def test_statistiques_detail(client, db_session):
    h = _admin(client, db_session)
    _entreprise_avec_offre(client)
    d = client.get("/api/admin/statistiques/detail", headers=h)
    assert d.status_code == 200, d.text
    assert d.json()["candidatures_par_offre"][0]["titre"] == "Stage Python"


def test_journal_pagine_avec_nom_de_l_admin(client, db_session):
    h = _admin(client, db_session)
    for nom, mail in (("Alice", "alice@example.com"), ("Bob", "bob@example.com")):
        _login(client, _data("etudiant", mail, nom))
        uid = _uid(db_session, mail)
        client.patch(f"/api/admin/utilisateurs/{uid}/suspendre", headers=h)

    logs = client.get("/api/admin/logs", headers=h).json()
    assert len(logs) == 2 and logs[0]["admin_nom"] == "Admin"
    assert len(client.get("/api/admin/logs?limit=1", headers=h).json()) == 1
    assert len(client.get("/api/admin/logs?limit=1&offset=1", headers=h).json()) == 1
    assert client.get("/api/admin/logs?limit=0", headers=h).status_code == 422


def test_promouvoir_admin(client, db_session):
    h = _login(client, _data("entreprise", "ent@example.com", "Entreprise"))
    assert client.get("/api/admin/statistiques", headers=h).status_code == 403
    user, cree = promouvoir_admin(db_session, "ENT@example.com")
    assert cree is False and user.is_admin is True
    assert client.get("/api/admin/statistiques", headers=h).status_code == 200

    user, cree = promouvoir_admin(
        db_session, "nouveau@example.com", nom="Nouvel Admin", mot_de_passe="motdepasse123"
    )
    assert cree is True
    r = client.post(
        "/api/auth/login", json={"email": "nouveau@example.com", "mot_de_passe": "motdepasse123"}
    )
    client.cookies.clear()
    assert r.status_code == 200 and r.json()["user"]["is_admin"] is True

    with pytest.raises(ValueError):
        promouvoir_admin(db_session, "inconnu@example.com")
    with pytest.raises(ValueError):
        promouvoir_admin(db_session, "x@example.com", nom="X Y", mot_de_passe="court")
