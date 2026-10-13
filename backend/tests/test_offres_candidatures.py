def _register_and_login(client, data):
    client.post("/api/auth/register", json=data)
    client.post(
        "/api/auth/login",
        json={"email": data["email"], "mot_de_passe": data["mot_de_passe"]},
    )


def test_creer_offre_sans_profil_entreprise_rejete(client, entreprise_data):
    _register_and_login(client, entreprise_data)
    response = client.post(
        "/api/offres",
        json={"titre": "Test", "type_contrat": "cdi", "disponibilite": "immediate"},
    )
    assert response.status_code == 400


def test_creer_offre_avec_profil_complet(client, entreprise_data):
    _register_and_login(client, entreprise_data)
    client.put("/api/profiles/me", json={"secteur": "Tech"})

    response = client.post(
        "/api/offres",
        json={
            "titre": "Developpeur Python",
            "type_contrat": "cdi",
            "competences_obligatoires": "Python",
            "disponibilite": "immediate",
        },
    )
    assert response.status_code == 201
    assert response.json()["titre"] == "Developpeur Python"


def test_offres_publiques_visibles_sans_authentification(client, entreprise_data):
    _register_and_login(client, entreprise_data)
    client.put("/api/profiles/me", json={"secteur": "Tech"})
    client.post(
        "/api/offres",
        json={"titre": "Test public", "type_contrat": "cdi", "disponibilite": "immediate"},
    )

    public_client_response = client.get("/api/offres")
    assert public_client_response.status_code == 200
    assert len(public_client_response.json()) == 1


def test_candidature_et_score_matching(client, entreprise_data, etudiant_data):
    _register_and_login(client, entreprise_data)
    client.put("/api/profiles/me", json={"secteur": "Tech"})
    offre_response = client.post(
        "/api/offres",
        json={
            "titre": "Developpeur Python",
            "type_contrat": "cdi",
            "competences_obligatoires": "Python",
            "disponibilite": "immediate",
        },
    )
    offre_id = offre_response.json()["id"]
    client.post("/api/auth/logout")

    _register_and_login(client, etudiant_data)
    client.put("/api/profiles/me", json={"competences": "Python", "disponibilite": "immediate"})

    candidature_response = client.post(
        "/api/candidatures", json={"offre_id": offre_id, "message": "Interesse"}
    )
    assert candidature_response.status_code == 201

    recommandations = client.get("/api/offres/recommandees")
    assert recommandations.status_code == 200
    assert recommandations.json()[0]["score_global"] == 100.0


def test_candidature_en_double_rejetee(client, entreprise_data, etudiant_data):
    _register_and_login(client, entreprise_data)
    client.put("/api/profiles/me", json={"secteur": "Tech"})
    offre_response = client.post(
        "/api/offres",
        json={"titre": "Test", "type_contrat": "cdi", "disponibilite": "immediate"},
    )
    offre_id = offre_response.json()["id"]
    client.post("/api/auth/logout")

    _register_and_login(client, etudiant_data)
    client.post("/api/candidatures", json={"offre_id": offre_id})
    response = client.post("/api/candidatures", json={"offre_id": offre_id})
    assert response.status_code == 400