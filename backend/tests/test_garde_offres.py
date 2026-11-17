"""Une entreprise refusee apres coup ne peut plus modifier ni supprimer ses offres."""

from datetime import datetime

from app.core.config import settings
from app.models.user import User


def test_entreprise_refusee_ne_modifie_plus_ses_offres(client, db_session, monkeypatch):
    monkeypatch.setattr(settings, "require_email_verification", True)
    r = client.post(
        "/api/auth/register",
        json={
            "nom": "Ent Offres",
            "email": "ent.offres@example.com",
            "mot_de_passe": "Motdepasse1!",
            "type_profil": "entreprise",
            "consentement": True,
            "consent_version": "1.0",
        },
    )
    assert r.status_code == 201, r.text
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}

    u = db_session.query(User).filter(User.email == "ent.offres@example.com").first()
    u.statut_validation = "validee"
    u.email_verifie_at = datetime.utcnow()
    db_session.commit()

    client.put("/api/profiles/me", headers=h, json={"secteur": "Tech"})
    c = client.post("/api/offres", headers=h, json={"titre": "Stage Python", "type_contrat": "stage"})
    assert c.status_code == 201, c.text
    oid = c.json()["id"]
    assert client.patch(f"/api/offres/{oid}", headers=h, json={"titre": "Stage Python 2"}).status_code == 200

    db_session.expire_all()
    u = db_session.query(User).filter(User.email == "ent.offres@example.com").first()
    u.statut_validation = "refusee"
    db_session.commit()

    assert client.patch(f"/api/offres/{oid}", headers=h, json={"titre": "Piratage"}).status_code == 403
    assert client.delete(f"/api/offres/{oid}", headers=h).status_code == 403