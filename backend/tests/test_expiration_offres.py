"""Expiration automatique des offres."""

from datetime import datetime, timedelta

from app.models.offre import Offre


def _data(type_profil, email, nom):
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


def _offre(client):
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


def test_offre_recente_reste_active(client, db_session):
    h, _ = _offre(client)
    _vieillir(db_session, 10)
    assert client.get("/api/offres/mine", headers=h).json()[0]["statut"] == "active"


def test_offre_ancienne_expire(client, db_session):
    h, _ = _offre(client)
    _vieillir(db_session, 61)
    assert client.get("/api/offres/mine", headers=h).json()[0]["statut"] == "expiree"
    assert client.get("/api/offres").json() == []


def test_candidature_sur_offre_expiree_refusee(client, db_session):
    _, offre_id = _offre(client)
    _vieillir(db_session, 61)
    h_etu = _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    r = client.post("/api/candidatures", headers=h_etu, json={"offre_id": offre_id})
    assert r.status_code == 400


def test_reactivation_renouvelle_l_offre(client, db_session):
    h, offre_id = _offre(client)
    _vieillir(db_session, 61)
    assert client.get("/api/offres/mine", headers=h).json()[0]["statut"] == "expiree"

    r = client.patch(f"/api/offres/{offre_id}", headers=h, json={"statut": "active"})
    assert r.status_code == 200 and r.json()["statut"] == "active"
    assert client.get("/api/offres/mine", headers=h).json()[0]["statut"] == "active"
