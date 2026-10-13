"""Tests de la planification des entretiens."""
from datetime import datetime, timedelta

from app.models.notification import Notification


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


def _scenario(client, email_ent="ent@example.com"):
    """Entreprise avec une offre, un etudiant qui postule. Renvoie (h_ent, h_etu, cand_id)."""
    h_ent = _login(client, _data("entreprise", email_ent, "Entreprise"))
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
    return h_ent, h_etu, r.json()["id"]


def test_planifier_entretien_cycle_complet(client, db_session):
    h_ent, h_etu, cand_id = _scenario(client)

    r = client.post(
        "/api/entretiens",
        headers=h_ent,
        json={
            "candidature_id": cand_id,
            "date_heure": _futur(),
            "duree_minutes": 45,
            "mode": "visio",
            "lieu_ou_lien": "https://meet.example.com/abc",
            "message": "Preparez une presentation de 5 minutes.",
        },
    )
    assert r.status_code == 201, r.text
    entretien = r.json()
    assert entretien["statut"] == "planifie"

    # la candidature passe automatiquement au statut "entretien"
    mine = client.get("/api/candidatures/mine", headers=h_etu).json()
    assert mine[0]["statut"] == "entretien"

    # le talent est notifie
    nb = db_session.query(Notification).filter(
        Notification.type_evenement == "entretien_planifie"
    ).count()
    assert nb == 1

    # les deux parties voient l'entretien
    assert len(client.get("/api/entretiens", headers=h_ent).json()) == 1
    vu_talent = client.get("/api/entretiens", headers=h_etu).json()
    assert len(vu_talent) == 1 and vu_talent[0]["id"] == entretien["id"]


def test_entretien_annulation_et_filtre(client, db_session):
    h_ent, h_etu, cand_id = _scenario(client)
    e_id = client.post(
        "/api/entretiens",
        headers=h_ent,
        json={"candidature_id": cand_id, "date_heure": _futur()},
    ).json()["id"]

    r = client.patch(f"/api/entretiens/{e_id}", headers=h_ent, json={"statut": "annule"})
    assert r.status_code == 200 and r.json()["statut"] == "annule"

    nb = db_session.query(Notification).filter(
        Notification.type_evenement == "entretien_annule"
    ).count()
    assert nb == 1
    assert client.get("/api/entretiens?statut=planifie", headers=h_ent).json() == []
    assert len(client.get("/api/entretiens?statut=annule", headers=h_ent).json()) == 1


def test_entretien_report_notifie(client, db_session):
    h_ent, _, cand_id = _scenario(client)
    e_id = client.post(
        "/api/entretiens",
        headers=h_ent,
        json={"candidature_id": cand_id, "date_heure": _futur(3)},
    ).json()["id"]

    r = client.patch(f"/api/entretiens/{e_id}", headers=h_ent, json={"date_heure": _futur(5)})
    assert r.status_code == 200, r.text
    nb = db_session.query(Notification).filter(
        Notification.type_evenement == "entretien_modifie"
    ).count()
    assert nb == 1


def test_entretien_date_passee_refusee(client):
    h_ent, _, cand_id = _scenario(client)
    passe = (datetime.utcnow() - timedelta(days=1)).isoformat()
    r = client.post(
        "/api/entretiens",
        headers=h_ent,
        json={"candidature_id": cand_id, "date_heure": passe},
    )
    assert r.status_code == 400


def test_entretien_validation(client):
    h_ent, _, cand_id = _scenario(client)
    r = client.post(
        "/api/entretiens",
        headers=h_ent,
        json={"candidature_id": cand_id, "date_heure": _futur(), "mode": "hologramme"},
    )
    assert r.status_code == 422
    r = client.post(
        "/api/entretiens",
        headers=h_ent,
        json={"candidature_id": cand_id, "date_heure": _futur(), "duree_minutes": 1},
    )
    assert r.status_code == 422


def test_entretien_droits(client):
    h_ent, h_etu, cand_id = _scenario(client)
    corps = {"candidature_id": cand_id, "date_heure": _futur()}

    # le talent ne peut ni planifier ni modifier
    assert client.post("/api/entretiens", headers=h_etu, json=corps).status_code == 403

    e_id = client.post("/api/entretiens", headers=h_ent, json=corps).json()["id"]
    r = client.patch(f"/api/entretiens/{e_id}", headers=h_etu, json={"statut": "annule"})
    assert r.status_code == 403

    # une autre entreprise ne peut pas toucher a cette candidature
    h_autre = _login(client, _data("entreprise", "autre@example.com", "Autre"))
    client.put("/api/profiles/me", headers=h_autre, json={"secteur": "Finance"})
    assert client.post("/api/entretiens", headers=h_autre, json=corps).status_code == 403
    r = client.patch(f"/api/entretiens/{e_id}", headers=h_autre, json={"statut": "annule"})
    assert r.status_code == 403
    assert client.get("/api/entretiens", headers=h_autre).json() == []

    # sans connexion
    assert client.get("/api/entretiens").status_code == 401


def test_entretien_candidature_cloturee(client):
    h_ent, _, cand_id = _scenario(client)
    r = client.patch(
        f"/api/candidatures/{cand_id}/statut",
        headers=h_ent,
        json={"statut": "refusee"},
    )
    assert r.status_code == 200, r.text
    r = client.post(
        "/api/entretiens",
        headers=h_ent,
        json={"candidature_id": cand_id, "date_heure": _futur()},
    )
    assert r.status_code == 400