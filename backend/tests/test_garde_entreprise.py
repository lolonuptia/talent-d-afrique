"""Une entreprise non validee ne peut rien faire sur les routeurs d'action."""

from datetime import datetime

from app.core.config import settings
from app.models.user import User

ROUTES_GET = [
    "/api/candidatures/mine",
    "/api/candidatures/recues",
    "/api/entretiens",
    "/api/messages",
    "/api/missions",
    "/api/missions/mine",
]


def _inscrire(client, email, type_profil):
    r = client.post(
        "/api/auth/register",
        json={
            "nom": "Compte Test",
            "email": email,
            "mot_de_passe": "Motdepasse1!",
            "type_profil": type_profil,
            "consentement": True,
            "consent_version": "1.0",
        },
    )
    assert r.status_code == 201, r.text
    return r.json()


def _h(data):
    return {"Authorization": f"Bearer {data['access_token']}"}


def _bloque(r):
    return r.status_code == 403 and (
        "en attente de validation" in r.text or "Confirmez votre adresse email" in r.text
    )


def test_entreprise_en_attente_bloquee_partout(client, monkeypatch):
    monkeypatch.setattr(settings, "require_email_verification", True)
    h = _h(_inscrire(client, "ent.garde1@example.com", "entreprise"))
    for url in ROUTES_GET:
        r = client.get(url, headers=h)
        assert _bloque(r), f"{url} -> {r.status_code} {r.text}"
    assert _bloque(client.post("/api/missions", headers=h, json={}))


def test_entreprise_validee_et_verifiee_n_est_plus_bloquee(client, db_session, monkeypatch):
    monkeypatch.setattr(settings, "require_email_verification", True)
    h = _h(_inscrire(client, "ent.garde2@example.com", "entreprise"))
    u = db_session.query(User).filter(User.email == "ent.garde2@example.com").first()
    u.statut_validation = "validee"
    u.email_verifie_at = datetime.utcnow()
    db_session.commit()
    for url in ROUTES_GET:
        r = client.get(url, headers=h)
        assert not _bloque(r), f"{url} -> {r.status_code} {r.text}"


def test_entreprise_refusee_reste_bloquee(client, db_session, monkeypatch):
    monkeypatch.setattr(settings, "require_email_verification", True)
    h = _h(_inscrire(client, "ent.garde3@example.com", "entreprise"))
    u = db_session.query(User).filter(User.email == "ent.garde3@example.com").first()
    u.statut_validation = "refusee"
    u.email_verifie_at = datetime.utcnow()
    db_session.commit()
    assert client.get("/api/missions", headers=h).status_code == 403


def test_etudiant_non_concerne_par_la_garde(client, monkeypatch):
    monkeypatch.setattr(settings, "require_email_verification", True)
    h = _h(_inscrire(client, "etu.garde@example.com", "etudiant"))
    for url in ("/api/candidatures/mine", "/api/messages"):
        r = client.get(url, headers=h)
        assert not _bloque(r), f"{url} -> {r.status_code} {r.text}"