"""Tests des certifications, du portfolio et du detail d'un talent."""
import uuid


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


CERT = {
    "intitule": "AWS Cloud Practitioner",
    "organisme": "Amazon",
    "date_obtention": "2026-05-01",
    "url_verification": "https://example.com/verif/1",
}
ITEM = {"titre": "Site vitrine", "description": "Projet React", "url": "https://example.com/p"}


def test_certifications_cycle_complet(client):
    h = _login(client, _data("etudiant", "etu@example.com"))
    r = client.post("/api/certifications", headers=h, json=CERT)
    assert r.status_code == 201, r.text
    cert_id = r.json()["id"]

    r = client.get("/api/certifications", headers=h)
    assert r.status_code == 200 and len(r.json()) == 1

    assert client.delete(f"/api/certifications/{cert_id}", headers=h).status_code == 204
    assert client.get("/api/certifications", headers=h).json() == []


def test_certifications_isolation_et_roles(client):
    h_etu = _login(client, _data("etudiant", "etu@example.com"))
    h_fre = _login(client, _data("freelance", "fre@example.com"))
    h_ent = _login(client, _data("entreprise", "ent@example.com"))

    cert_id = client.post("/api/certifications", headers=h_etu, json=CERT).json()["id"]

    # un autre talent ne peut pas supprimer la certification d'autrui
    assert client.delete(f"/api/certifications/{cert_id}", headers=h_fre).status_code == 404
    # une entreprise n'a pas de certifications
    assert client.post("/api/certifications", headers=h_ent, json=CERT).status_code == 403
    assert client.get("/api/certifications", headers=h_ent).status_code == 403
    # champ obligatoire
    r = client.post("/api/certifications", headers=h_etu, json={"organisme": "X"})
    assert r.status_code == 422


def test_portfolio_cycle_complet(client):
    h = _login(client, _data("freelance", "fre@example.com"))
    r = client.post("/api/portfolio", headers=h, json=ITEM)
    assert r.status_code == 201, r.text
    item_id = r.json()["id"]

    assert len(client.get("/api/portfolio", headers=h).json()) == 1
    assert client.delete(f"/api/portfolio/{item_id}", headers=h).status_code == 204
    assert client.get("/api/portfolio", headers=h).json() == []


def test_portfolio_isolation_et_roles(client):
    h_etu = _login(client, _data("etudiant", "etu@example.com"))
    h_fre = _login(client, _data("freelance", "fre@example.com"))
    h_ent = _login(client, _data("entreprise", "ent@example.com"))

    item_id = client.post("/api/portfolio", headers=h_fre, json=ITEM).json()["id"]
    assert client.delete(f"/api/portfolio/{item_id}", headers=h_etu).status_code == 404
    assert client.post("/api/portfolio", headers=h_ent, json=ITEM).status_code == 403


def test_detail_talent_visible(client):
    h_etu = _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    r = client.put(
        "/api/profiles/me",
        headers=h_etu,
        json={"competences": "Python", "visible_aux_entreprises": True},
    )
    profile_id = r.json()["id"]
    client.post("/api/certifications", headers=h_etu, json=CERT)
    client.post("/api/portfolio", headers=h_etu, json=ITEM)

    h_ent = _login(client, _data("entreprise", "ent@example.com"))
    r = client.get(f"/api/talents/{profile_id}", headers=h_ent)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["nom"] == "Aminata"
    assert len(d["certifications"]) == 1 and len(d["portfolio"]) == 1
    assert "@" not in r.text


def test_detail_talent_masque_ou_inconnu(client):
    h_etu = _login(client, _data("etudiant", "etu@example.com"))
    r = client.put("/api/profiles/me", headers=h_etu, json={"competences": "Python"})
    profile_id = r.json()["id"]  # visibilite non activee

    h_ent = _login(client, _data("entreprise", "ent@example.com"))
    assert client.get(f"/api/talents/{profile_id}", headers=h_ent).status_code == 404
    assert client.get(f"/api/talents/{uuid.uuid4()}", headers=h_ent).status_code == 404
    # un talent n'a pas acces au detail
    assert client.get(f"/api/talents/{profile_id}", headers=h_etu).status_code == 403