def _login(client, data):
    client.post("/api/auth/register", json=data)
    r = client.post(
        "/api/auth/login",
        json={"email": data["email"], "mot_de_passe": data["mot_de_passe"]},
    )
    assert r.status_code == 200
    token = r.json()["access_token"]
    client.cookies.clear()
    return {"Authorization": f"Bearer {token}"}


def _creer_offre(client, headers):
    client.put("/api/profiles/me", headers=headers, json={"secteur": "Tech"})
    r = client.post(
        "/api/offres",
        headers=headers,
        json={
            "titre": "Stage Python",
            "type_contrat": "stage",
            "competences_obligatoires": "python",
        },
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


def test_favoris_cycle_complet(client, entreprise_data, etudiant_data):
    h_ent = _login(client, entreprise_data)
    h_etu = _login(client, etudiant_data)
    offre_id = _creer_offre(client, h_ent)

    r = client.post("/api/favoris", headers=h_etu, json={"offre_id": offre_id})
    assert r.status_code == 201

    r = client.post("/api/favoris", headers=h_etu, json={"offre_id": offre_id})
    assert r.status_code == 400

    r = client.get("/api/favoris", headers=h_etu)
    assert r.status_code == 200 and len(r.json()) == 1

    r = client.delete(f"/api/favoris/{offre_id}", headers=h_etu)
    assert r.status_code == 204

    r = client.get("/api/favoris", headers=h_etu)
    assert r.json() == []


def test_favoris_refuses_a_une_entreprise(client, entreprise_data):
    h_ent = _login(client, entreprise_data)
    r = client.get("/api/favoris", headers=h_ent)
    assert r.status_code == 403