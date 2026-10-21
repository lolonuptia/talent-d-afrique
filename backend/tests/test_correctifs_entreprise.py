"""Compte entreprise : statuts, offres, emails, profil candidat, expiration, configuration."""

from datetime import datetime, timedelta
from types import SimpleNamespace

import pytest

from app.core.checks import verifier_configuration_production
from app.core.config import settings
from app.models.notification import Notification
from app.models.offre import Offre


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
    token = r.json()["access_token"]
    client.cookies.clear()
    return {"Authorization": f"Bearer {token}"}


def _futur(jours=3):
    return (datetime.utcnow() + timedelta(days=jours)).isoformat()


def _scenario(client):
    """Entreprise + offre + etudiant qui postule. Renvoie (h_ent, h_etu, cand_id, offre_id)."""
    h_ent = _login(client, _data("entreprise", "ent@example.com", "Entreprise"))
    client.put("/api/profiles/me", headers=h_ent, json={"secteur": "Tech"})
    r = client.post(
        "/api/offres",
        headers=h_ent,
        json={
            "titre": "Stage Python",
            "type_contrat": "stage",
            "competences_obligatoires": "python",
        },
    )
    assert r.status_code == 201, r.text
    offre_id = r.json()["id"]
    h_etu = _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    r = client.post("/api/candidatures", headers=h_etu, json={"offre_id": offre_id})
    assert r.status_code == 201, r.text
    return h_ent, h_etu, r.json()["id"], offre_id


def _notifs(db_session, type_evenement):
    db_session.expire_all()
    return (
        db_session.query(Notification).filter(Notification.type_evenement == type_evenement).all()
    )


def _offre_seule(client):
    h = _login(client, _data("entreprise", "ent@example.com", "Entreprise"))
    client.put("/api/profiles/me", headers=h, json={"secteur": "Tech"})
    r = client.post(
        "/api/offres", headers=h, json={"titre": "Stage Python", "type_contrat": "stage"}
    )
    assert r.status_code == 201, r.text
    return h, r.json()["id"]


def _vieillir(db_session, jours):
    offre = db_session.query(Offre).first()
    offre.updated_at = datetime.utcnow() - timedelta(days=jours)
    db_session.commit()


# ---------- suppression de comptes ----------
def test_suppression_entreprise_archive_ses_offres(client, db_session):
    h_ent, _, _, offre_id = _scenario(client)
    assert client.delete("/api/users/me", headers=h_ent).status_code == 204

    db_session.expire_all()
    assert db_session.query(Offre).first().statut == "archivee"
    assert client.get("/api/offres").json() == []
    h2 = _login(client, _data("etudiant", "etu2@example.com", "Autre"))
    r = client.post("/api/candidatures", headers=h2, json={"offre_id": offre_id})
    assert r.status_code == 400


def test_etudiant_supprime_disparait_des_candidatures_recues(client):
    h_ent, h_etu, _, offre_id = _scenario(client)
    assert client.delete("/api/users/me", headers=h_etu).status_code == 204
    assert client.get("/api/candidatures/recues", headers=h_ent).json() == []
    url = f"/api/candidatures/offre/{offre_id}/classees"
    assert client.get(url, headers=h_ent).json() == []


# ---------- statuts ----------
def test_meme_statut_ne_notifie_pas_deux_fois(client, db_session):
    h_ent, _, cand_id, _ = _scenario(client)
    url = f"/api/candidatures/{cand_id}/statut"
    assert client.patch(url, headers=h_ent, json={"statut": "en_cours"}).status_code == 200
    assert len(_notifs(db_session, "statut_change")) == 1
    assert client.patch(url, headers=h_ent, json={"statut": "en_cours"}).status_code == 200
    assert len(_notifs(db_session, "statut_change")) == 1


def test_statut_entretien_sans_entretien_ne_promet_rien(client, db_session):
    h_ent, _, cand_id, _ = _scenario(client)
    url = f"/api/candidatures/{cand_id}/statut"
    assert client.patch(url, headers=h_ent, json={"statut": "entretien"}).status_code == 200
    [notif] = _notifs(db_session, "statut_change")
    assert "propos" not in notif.message


def test_refus_annule_les_entretiens_a_venir(client):
    h_ent, _, cand_id, _ = _scenario(client)
    corps = {"candidature_id": cand_id, "date_heure": _futur()}
    assert client.post("/api/entretiens", headers=h_ent, json=corps).status_code == 201
    url = f"/api/candidatures/{cand_id}/statut"
    assert client.patch(url, headers=h_ent, json={"statut": "refusee"}).status_code == 200
    lignes = client.get("/api/entretiens", headers=h_ent).json()
    assert [e["statut"] for e in lignes] == ["annule"]


# ---------- emails ----------
def test_emails_html_echappes(client, monkeypatch):
    envoyes = []

    class _Immediat:
        def __init__(self, target, args=(), daemon=None):
            self._target, self._args = target, args

        def start(self):
            self._target(*self._args)

    monkeypatch.setattr("app.services.notifications.threading", SimpleNamespace(Thread=_Immediat))
    monkeypatch.setattr(
        "app.services.notifications._envoyer_email_sync",
        lambda cible, sujet, html: envoyes.append((cible.email, sujet, html)),
    )

    h_ent = _login(client, _data("entreprise", "ent@example.com", "Entreprise"))
    client.put("/api/profiles/me", headers=h_ent, json={"secteur": "Tech"})
    r = client.post(
        "/api/offres", headers=h_ent, json={"titre": "<b>Piege</b>", "type_contrat": "stage"}
    )
    h_etu = _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    client.post("/api/candidatures", headers=h_etu, json={"offre_id": r.json()["id"]})

    assert envoyes
    contenu = envoyes[0][2]
    assert "<b>" not in contenu and "&lt;b&gt;" in contenu


# ---------- visibilite des offres ----------
def test_offre_archivee_non_publique(client):
    h_ent, h_etu, _, offre_id = _scenario(client)
    h_autre = _login(client, _data("etudiant", "autre@example.com", "Autre"))
    assert client.get(f"/api/offres/{offre_id}").status_code == 200

    r = client.patch(f"/api/offres/{offre_id}", headers=h_ent, json={"statut": "archivee"})
    assert r.status_code == 200
    assert client.get(f"/api/offres/{offre_id}").status_code == 404
    assert client.get(f"/api/offres/{offre_id}", headers=h_autre).status_code == 404
    assert client.get("/api/offres?statut=archivee").json() == []
    assert client.get(f"/api/offres/{offre_id}", headers=h_ent).status_code == 200
    assert client.get(f"/api/offres/{offre_id}", headers=h_etu).status_code == 200


# ---------- profil et CV du candidat ----------
def test_entreprise_voit_le_profil_et_le_cv_du_candidat(client, tmp_path, monkeypatch):
    h_ent, h_etu, cand_id, _ = _scenario(client)
    client.put(
        "/api/profiles/me",
        headers=h_etu,
        json={"competences": "Python, SQL", "formations": "Licence info"},
    )
    url = f"/api/candidatures/{cand_id}/candidat"

    r = client.get(url, headers=h_ent)
    assert r.status_code == 200, r.text
    profil = r.json()
    assert profil["nom"] == "Aminata"
    assert profil["competences"] == ["Python", "SQL"]
    assert profil["formations"] == "Licence info"
    assert profil["a_un_cv"] is False
    assert "email" not in profil

    monkeypatch.setattr(settings, "cv_storage_dir", str(tmp_path))
    assert client.get(f"/api/candidatures/{cand_id}/cv", headers=h_ent).status_code == 404
    candidat_id = client.get("/api/candidatures/mine", headers=h_etu).json()[0]["candidat_id"]
    (tmp_path / f"{candidat_id}.pdf").write_bytes(b"%PDF-1.4 test")
    assert client.get(url, headers=h_ent).json()["a_un_cv"] is True
    r = client.get(f"/api/candidatures/{cand_id}/cv", headers=h_ent)
    assert r.status_code == 200 and r.content.startswith(b"%PDF")

    assert client.get(url, headers=h_etu).status_code == 403
    assert client.get(url).status_code == 401
    h_autre = _login(client, _data("entreprise", "autre@example.com", "Autre"))
    client.put("/api/profiles/me", headers=h_autre, json={"secteur": "Finance"})
    assert client.get(url, headers=h_autre).status_code == 403
    assert client.get(f"/api/candidatures/{cand_id}/cv", headers=h_autre).status_code == 403


# ---------- expiration ----------
def test_avertissement_avant_expiration(client, db_session):
    h, _ = _offre_seule(client)
    _vieillir(db_session, 55)
    assert client.get("/api/offres/mine", headers=h).json()[0]["statut"] == "active"
    assert len(_notifs(db_session, "offre_bientot_expiree")) == 1
    client.get("/api/offres/mine", headers=h)
    assert len(_notifs(db_session, "offre_bientot_expiree")) == 1


def test_notification_a_l_expiration(client, db_session):
    h, _ = _offre_seule(client)
    _vieillir(db_session, 61)
    client.get("/api/offres/mine", headers=h)
    client.get("/api/offres/mine", headers=h)
    assert len(_notifs(db_session, "offre_expiree")) == 1


def test_prolonger_renouvelle_l_offre(client, db_session):
    h, offre_id = _offre_seule(client)
    _vieillir(db_session, 55)
    assert client.patch(f"/api/offres/{offre_id}", headers=h, json={}).status_code == 200
    db_session.expire_all()
    assert (datetime.utcnow() - db_session.query(Offre).first().updated_at).days < 1


# ---------- changement d'email ----------
def test_changement_email_entreprise_demande_le_mot_de_passe(client):
    h = _login(client, _data("entreprise", "ent@example.com", "Entreprise"))
    url = "/api/users/me"
    assert client.patch(url, headers=h, json={"email": "nouveau@example.com"}).status_code == 400
    faux = {"email": "nouveau@example.com", "mot_de_passe_actuel": "faux-faux-faux"}
    assert client.patch(url, headers=h, json=faux).status_code == 400
    bon = {"email": "nouveau@example.com", "mot_de_passe_actuel": "motdepasse123"}
    assert client.patch(url, headers=h, json=bon).status_code == 200
    # email inchange : aucun mot de passe demande
    sans_changer = {"nom": "Nouveau nom", "email": "nouveau@example.com"}
    assert client.patch(url, headers=h, json=sans_changer).status_code == 200


def test_changement_email_talent_sans_mot_de_passe(client):
    h = _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    r = client.patch("/api/users/me", headers=h, json={"email": "autre@example.com"})
    assert r.status_code == 200


# ---------- configuration de production ----------
def _cfg(**kw):
    base = {
        "environment": "production",
        "secret_key": "x" * 40,
        "database_url": "postgresql://u:s3cret@db/app",
        "frontend_url": "https://app.exemple.com",
    }
    return SimpleNamespace(**{**base, **kw})


def test_configuration_production_valide():
    verifier_configuration_production(_cfg())


def test_configuration_production_dangereuse():
    with pytest.raises(RuntimeError) as exc:
        verifier_configuration_production(
            _cfg(
                secret_key="court",
                database_url="postgresql://postgres:password123@localhost/db",
                frontend_url="http://localhost:5173",
            )
        )
    message = str(exc.value)
    assert "SECRET_KEY" in message and "DATABASE_URL" in message and "FRONTEND_URL" in message


def test_configuration_hors_production_toleree():
    verifier_configuration_production(_cfg(environment="development", secret_key="x"))
