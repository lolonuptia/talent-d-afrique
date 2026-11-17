"""Un etudiant doit saisir son code avant d'utiliser l'API (la garde est cote serveur)."""

from app.core.config import settings
from app.models.user import User
from app.services.code_verification import generer_code

URLS = [
    "/api/candidatures/mine",
    "/api/favoris",
    "/api/notifications",
    "/api/certifications",
    "/api/portfolio",
    "/api/messages",
    "/api/missions/mine",
    "/api/offres/recommandees",
    "/api/profiles/me",
]


def test_etudiant_bloque_puis_debloque_par_le_code(client, db_session, monkeypatch):
    monkeypatch.setattr(settings, "require_email_verification", True)
    r = client.post(
        "/api/auth/register",
        json={
            "nom": "Etu Garde",
            "email": "etu.garde2@example.com",
            "mot_de_passe": "Motdepasse1!",
            "type_profil": "etudiant",
            "consentement": True,
            "consent_version": "1.0",
        },
    )
    assert r.status_code == 201, r.text
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}

    for url in URLS:
        resp = client.get(url, headers=h)
        assert resp.status_code == 403 and "code" in resp.text, f"{url} -> {resp.status_code} {resp.text}"
    # ces routes restent ouvertes pour pouvoir saisir le code
    assert client.get("/api/auth/me", headers=h).status_code == 200
    assert client.post("/api/auth/resend-code", headers=h).status_code in (200, 429)

    user = db_session.query(User).filter(User.email == "etu.garde2@example.com").first()
    code = generer_code(user)
    db_session.commit()
    assert client.post("/api/auth/verify-code", headers=h, json={"code": code}).status_code == 200

    for url in URLS:
        resp = client.get(url, headers=h)
        assert resp.status_code != 403, f"{url} -> {resp.status_code} {resp.text}"