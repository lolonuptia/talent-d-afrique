"""Tests de la messagerie (par candidature)."""
import uuid

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


def _scenario(client):
    """Entreprise + offre + etudiant qui postule. Renvoie (h_ent, h_etu, cand_id)."""
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
    h_etu = _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    r = client.post("/api/candidatures", headers=h_etu, json={"offre_id": r.json()["id"]})
    assert r.status_code == 201, r.text
    return h_ent, h_etu, r.json()["id"]


def test_messagerie_echange_et_lecture(client, db_session):
    h_ent, h_etu, cand_id = _scenario(client)

    r = client.post(f"/api/messages/{cand_id}", headers=h_ent, json={"contenu": "Bonjour"})
    assert r.status_code == 201, r.text

    # cote talent : 1 conversation, 1 message non lu
    conv = client.get("/api/messages", headers=h_etu).json()
    assert len(conv) == 1
    assert conv[0]["non_lus"] == 1
    assert conv[0]["dernier_message"] == "Bonjour"
    assert conv[0]["interlocuteur_nom"] == "Entreprise"
    assert conv[0]["offre_titre"] == "Stage Python"

    # l'expediteur n'a rien de non lu
    assert client.get("/api/messages", headers=h_ent).json()[0]["non_lus"] == 0

    # ouvrir la conversation marque comme lu
    msgs = client.get(f"/api/messages/{cand_id}", headers=h_etu).json()
    assert [m["contenu"] for m in msgs] == ["Bonjour"]
    assert client.get("/api/messages", headers=h_etu).json()[0]["non_lus"] == 0

    # reponse du talent
    r = client.post(f"/api/messages/{cand_id}", headers=h_etu, json={"contenu": "Merci"})
    assert r.status_code == 201
    assert client.get("/api/messages", headers=h_ent).json()[0]["non_lus"] == 1
    msgs = client.get(f"/api/messages/{cand_id}", headers=h_ent).json()
    assert [m["contenu"] for m in msgs] == ["Bonjour", "Merci"]

    # une notification par message, sans le contenu
    notifs = (
        db_session.query(Notification).filter(Notification.type_evenement == "message_recu").all()
    )
    assert len(notifs) == 2
    assert all("Bonjour" not in (n.message or "") for n in notifs)


def test_messagerie_sans_message_pas_de_conversation(client):
    h_ent, h_etu, _ = _scenario(client)
    assert client.get("/api/messages", headers=h_ent).json() == []
    assert client.get("/api/messages", headers=h_etu).json() == []


def test_messagerie_validation(client):
    h_ent, _, cand_id = _scenario(client)
    r = client.post(f"/api/messages/{cand_id}", headers=h_ent, json={"contenu": ""})
    assert r.status_code == 422
    r = client.post(f"/api/messages/{cand_id}", headers=h_ent, json={"contenu": "x" * 2001})
    assert r.status_code == 422


def test_messagerie_droits(client):
    h_ent, h_etu, cand_id = _scenario(client)
    client.post(f"/api/messages/{cand_id}", headers=h_ent, json={"contenu": "Secret"})

    # un autre talent
    h_autre_etu = _login(client, _data("etudiant", "autre.etu@example.com", "Autre"))
    assert client.get(f"/api/messages/{cand_id}", headers=h_autre_etu).status_code == 403
    r = client.post(f"/api/messages/{cand_id}", headers=h_autre_etu, json={"contenu": "Hey"})
    assert r.status_code == 403

    # une autre entreprise
    h_autre_ent = _login(client, _data("entreprise", "autre.ent@example.com", "Autre Ent"))
    client.put("/api/profiles/me", headers=h_autre_ent, json={"secteur": "Finance"})
    assert client.get(f"/api/messages/{cand_id}", headers=h_autre_ent).status_code == 403
    r = client.post(f"/api/messages/{cand_id}", headers=h_autre_ent, json={"contenu": "Hey"})
    assert r.status_code == 403
    assert client.get("/api/messages", headers=h_autre_ent).json() == []

    # candidature inconnue et acces sans connexion
    assert client.get(f"/api/messages/{uuid.uuid4()}", headers=h_etu).status_code == 404
    assert client.get("/api/messages").status_code == 401
    assert client.get(f"/api/messages/{cand_id}").status_code == 401