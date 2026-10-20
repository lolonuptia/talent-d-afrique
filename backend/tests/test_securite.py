"""Mot de passe oublie / change, mots de passe trop longs, validation des profils."""

from datetime import UTC, datetime, timedelta

from jose import jwt

from app.core.config import settings
from app.core.reset_tokens import creer_token_reset
from app.models.user import User


def _data(type_profil="entreprise", email="ent@example.com", mdp="motdepasse123"):
    return {
        "nom": "Test",
        "email": email,
        "mot_de_passe": mdp,
        "type_profil": type_profil,
        "consentement": True,
        "consent_version": "2026-09-06",
    }


def _inscrire(client, **kw):
    r = client.post("/api/auth/register", json=_data(**kw))
    assert r.status_code == 201, r.text
    client.cookies.clear()
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _login(client, email, mdp):
    r = client.post("/api/auth/login", json={"email": email, "mot_de_passe": mdp})
    client.cookies.clear()
    return r


def _user(db_session, email):
    db_session.expire_all()
    return db_session.query(User).filter(User.email == email).first()


def test_mot_de_passe_oublie_reponse_identique(client):
    _inscrire(client)
    a = client.post("/api/auth/forgot-password", json={"email": "ENT@example.com"})
    b = client.post("/api/auth/forgot-password", json={"email": "inconnu@example.com"})
    assert a.status_code == b.status_code == 200
    assert a.json() == b.json()


def test_reinitialisation_complete_usage_unique(client, db_session):
    _inscrire(client)
    token = creer_token_reset(_user(db_session, "ent@example.com"))

    r = client.post(
        "/api/auth/reset-password", json={"token": token, "mot_de_passe": "nouveaumdp456"}
    )
    assert r.status_code == 200, r.text
    assert _login(client, "ent@example.com", "nouveaumdp456").status_code == 200
    assert _login(client, "ent@example.com", "motdepasse123").status_code == 401

    # le meme lien ne marche plus
    r = client.post(
        "/api/auth/reset-password", json={"token": token, "mot_de_passe": "encoreautre789"}
    )
    assert r.status_code == 400


def test_jetons_invalides(client, db_session):
    _inscrire(client)
    user = _user(db_session, "ent@example.com")
    corps = {"mot_de_passe": "nouveaumdp456"}

    assert (
        client.post("/api/auth/reset-password", json={**corps, "token": "n-importe"}).status_code
        == 400
    )

    acces = _login(client, "ent@example.com", "motdepasse123").json()["access_token"]
    assert (
        client.post("/api/auth/reset-password", json={**corps, "token": acces}).status_code == 400
    )

    expire = jwt.encode(
        {
            "sub": str(user.id),
            "type": "reset",
            "fp": "x",
            "exp": datetime.now(UTC) - timedelta(minutes=1),
        },
        settings.secret_key,
        algorithm=settings.algorithm,
    )
    assert (
        client.post("/api/auth/reset-password", json={**corps, "token": expire}).status_code == 400
    )


def test_changement_mot_de_passe(client):
    h = _inscrire(client)
    url = "/api/auth/change-password"
    corps = {"ancien_mot_de_passe": "motdepasse123", "nouveau_mot_de_passe": "nouveaumdp456"}

    assert client.post(url, json=corps).status_code == 401
    mauvais = {**corps, "ancien_mot_de_passe": "faux-faux-faux"}
    assert client.post(url, headers=h, json=mauvais).status_code == 400
    court = {**corps, "nouveau_mot_de_passe": "court"}
    assert client.post(url, headers=h, json=court).status_code == 422

    assert client.post(url, headers=h, json=corps).status_code == 200
    assert _login(client, "ent@example.com", "nouveaumdp456").status_code == 200
    assert _login(client, "ent@example.com", "motdepasse123").status_code == 401


def test_mot_de_passe_trop_long_refuse_proprement(client):
    long_mdp = "a" * 80
    assert client.post("/api/auth/register", json=_data(mdp=long_mdp)).status_code == 422
    r = client.post("/api/auth/login", json={"email": "ent@example.com", "mot_de_passe": long_mdp})
    assert r.status_code == 422


def test_profil_entreprise_url_validee(client):
    h = _inscrire(client)
    r = client.put("/api/profiles/me", headers=h, json={"logo_url": "javascript:alert(1)"})
    assert r.status_code == 422, r.text
    assert "http" in str(r.json()["detail"])

    r = client.put(
        "/api/profiles/me",
        headers=h,
        json={"secteur": "Tech", "logo_url": "https://exemple.com/logo.png"},
    )
    assert r.status_code == 200, r.text
    assert (
        client.get("/api/profiles/me", headers=h).json()["logo_url"]
        == "https://exemple.com/logo.png"
    )

    # champ vide : accepte et stocke comme absent
    r = client.put("/api/profiles/me", headers=h, json={"logo_url": ""})
    assert r.status_code == 200 and r.json()["logo_url"] is None


def test_profil_freelance_valeurs_invalides_refusees(client):
    h = _inscrire(client, type_profil="freelance", email="free@example.com")
    assert client.put("/api/profiles/me", headers=h, json={"tjm": -5}).status_code == 422
    r = client.put("/api/profiles/me", headers=h, json={"portfolio_url": "data:text/html,x"})
    assert r.status_code == 422
    r = client.put(
        "/api/profiles/me", headers=h, json={"tjm": 150, "portfolio_url": "https://moi.dev"}
    )
    assert r.status_code == 200 and r.json()["tjm"] == 150
