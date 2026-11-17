"""Une entreprise en attente doit pouvoir completer son profil (mais rien d'autre)."""

from app.core.config import settings


def test_entreprise_en_attente_peut_completer_son_profil(client, monkeypatch):
    monkeypatch.setattr(settings, "require_email_verification", True)
    r = client.post(
        "/api/auth/register",
        json={
            "nom": "Ent Profil",
            "email": "ent.profil@example.com",
            "mot_de_passe": "Motdepasse1!",
            "type_profil": "entreprise",
            "consentement": True,
            "consent_version": "1.0",
        },
    )
    assert r.status_code == 201, r.text
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}
    assert client.put("/api/profiles/me", headers=h, json={"secteur": "Tech"}).status_code in (200, 201)
    assert client.get("/api/profiles/me", headers=h).status_code == 200
    # ...mais toujours bloquee pour agir
    assert client.get("/api/missions", headers=h).status_code == 403
    assert client.post("/api/offres", headers=h, json={"titre": "Stage Python", "type_contrat": "stage"}).status_code == 403