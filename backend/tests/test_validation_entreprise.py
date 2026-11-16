from app.models.user import User
from app.services.code_verification import generer_code


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


def test_entreprise_demarre_en_attente(client):
    data = _inscrire(client, "ent.attente@example.com", "entreprise")
    assert data["user"]["statut_validation"] == "en_attente"


def test_etudiant_est_valide_d_office(client):
    data = _inscrire(client, "etu.valide@example.com", "etudiant")
    assert data["user"]["statut_validation"] == "validee"
    assert data["user"]["email_verifie"] is False


def test_code_etudiant_mauvais_puis_bon(client, db_session):
    data = _inscrire(client, "etu.code@example.com", "etudiant")
    h = _h(data)
    user = db_session.query(User).filter(User.email == "etu.code@example.com").first()
    code = generer_code(user)
    db_session.commit()
    faux = "000000" if code != "000000" else "111111"

    assert client.post("/api/auth/verify-code", headers=h, json={"code": faux}).status_code == 400
    assert client.post("/api/auth/verify-code", headers=h, json={"code": code}).status_code == 200
    db_session.refresh(user)
    assert user.email_verifie_at is not None


def test_admin_valide_entreprise(client, db_session):
    ent = _inscrire(client, "ent.valider@example.com", "entreprise")
    adm = _inscrire(client, "admin.valid@example.com", "etudiant")
    url = f"/api/admin/entreprises/{ent['user']['id']}/valider"

    assert client.patch(url, headers=_h(adm)).status_code == 403  # pas encore admin

    admin = db_session.query(User).filter(User.email == "admin.valid@example.com").first()
    admin.is_admin = True
    db_session.commit()
    assert client.patch(url, headers=_h(adm)).status_code == 200

    entreprise = db_session.query(User).filter(User.email == "ent.valider@example.com").first()
    db_session.refresh(entreprise)
    assert entreprise.statut_validation == "validee"