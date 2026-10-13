def test_register_success(client, etudiant_data):
    response = client.post("/api/auth/register", json=etudiant_data)
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == etudiant_data["email"]
    assert "access_token" in data
    assert "mot_de_passe" not in data["user"]
    assert "mot_de_passe_hash" not in data["user"]


def test_register_duplicate_email_rejected(client, etudiant_data):
    client.post("/api/auth/register", json=etudiant_data)
    response = client.post("/api/auth/register", json=etudiant_data)
    assert response.status_code == 400


def test_register_without_consent_rejected(client, etudiant_data):
    etudiant_data["consentement"] = False
    response = client.post("/api/auth/register", json=etudiant_data)
    assert response.status_code == 400


def test_login_success_sets_cookies(client, etudiant_data):
    client.post("/api/auth/register", json=etudiant_data)
    response = client.post(
        "/api/auth/login",
        json={"email": etudiant_data["email"], "mot_de_passe": etudiant_data["mot_de_passe"]},
    )
    assert response.status_code == 200
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies


def test_login_wrong_password_rejected(client, etudiant_data):
    client.post("/api/auth/register", json=etudiant_data)
    response = client.post(
        "/api/auth/login",
        json={"email": etudiant_data["email"], "mot_de_passe": "mauvais_mdp"},
    )
    assert response.status_code == 401


def test_me_requires_authentication(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user(client, etudiant_data):
    client.post("/api/auth/register", json=etudiant_data)
    client.post(
        "/api/auth/login",
        json={"email": etudiant_data["email"], "mot_de_passe": etudiant_data["mot_de_passe"]},
    )
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == etudiant_data["email"]


def test_logout_clears_session(client, etudiant_data):
    client.post("/api/auth/register", json=etudiant_data)
    client.post(
        "/api/auth/login",
        json={"email": etudiant_data["email"], "mot_de_passe": etudiant_data["mot_de_passe"]},
    )
    client.post("/api/auth/logout")
    response = client.get("/api/auth/me")
    assert response.status_code == 401