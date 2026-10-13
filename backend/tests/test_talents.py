"""Tests de la recherche de talents (GET /api/talents)."""


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


def _profil(client, headers, **champs):
    r = client.put("/api/profiles/me", headers=headers, json=champs)
    assert r.status_code == 200, r.text
    return r.json()


def _entreprise(client):
    h = _login(client, _data("entreprise", "ent@example.com", "Entreprise"))
    _profil(client, h, secteur="Tech")
    return h


def test_talents_visible_sans_email(client):
    h_etu = _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    _profil(
        client, h_etu, competences="Python, SQL", disponibilite="immediate",
        visible_aux_entreprises=True,
    )
    h_ent = _entreprise(client)

    r = client.get("/api/talents?competence=python", headers=h_ent)
    assert r.status_code == 200, r.text
    resultats = r.json()
    assert len(resultats) == 1
    assert resultats[0]["nom"] == "Aminata"
    assert resultats[0]["type_profil"] == "etudiant"
    assert "email" not in r.text and "@" not in r.text


def test_talents_masque_par_defaut(client):
    h_etu = _login(client, _data("etudiant", "etu@example.com"))
    _profil(client, h_etu, competences="Python")  # visibilite non precisee
    h_ent = _entreprise(client)

    r = client.get("/api/talents", headers=h_ent)
    assert r.status_code == 200
    assert r.json() == []


def test_talents_redevient_invisible(client):
    h_etu = _login(client, _data("etudiant", "etu@example.com"))
    _profil(client, h_etu, competences="Python", visible_aux_entreprises=True)
    h_ent = _entreprise(client)
    assert len(client.get("/api/talents", headers=h_ent).json()) == 1

    _profil(client, h_etu, visible_aux_entreprises=False)
    assert client.get("/api/talents", headers=h_ent).json() == []


def test_talents_refuses_aux_non_entreprises(client):
    h_etu = _login(client, _data("etudiant", "etu@example.com"))
    h_fre = _login(client, _data("freelance", "fre@example.com"))
    assert client.get("/api/talents", headers=h_etu).status_code == 403
    assert client.get("/api/talents", headers=h_fre).status_code == 403


def test_talents_refuses_sans_connexion(client):
    assert client.get("/api/talents").status_code == 401


def test_talents_filtres_tjm_et_disponibilite(client):
    h_etu = _login(client, _data("etudiant", "etu@example.com", "Etudiant"))
    _profil(client, h_etu, competences="Python", visible_aux_entreprises=True)

    h_f1 = _login(client, _data("freelance", "f1@example.com", "Freelance Pas Cher"))
    _profil(
        client, h_f1, competences="Python", tjm=150, disponibilite="immediate",
        visible_aux_entreprises=True,
    )
    h_f2 = _login(client, _data("freelance", "f2@example.com", "Freelance Cher"))
    _profil(
        client, h_f2, competences="Python", tjm=400, disponibilite="3_mois",
        visible_aux_entreprises=True,
    )
    h_ent = _entreprise(client)

    # TJM max : exclut le freelance cher et les etudiants (qui n'ont pas de TJM)
    r = client.get("/api/talents?tjm_max=200", headers=h_ent)
    assert [t["nom"] for t in r.json()] == ["Freelance Pas Cher"]

    # Disponibilite
    r = client.get("/api/talents?disponibilite=3_mois", headers=h_ent)
    assert [t["nom"] for t in r.json()] == ["Freelance Cher"]

    # Type de profil
    r = client.get("/api/talents?type_profil=etudiant", headers=h_ent)
    assert [t["nom"] for t in r.json()] == ["Etudiant"]


def test_talents_pagination(client):
    for i, nom in enumerate(["Alice", "Bob", "Carl"]):
        h = _login(client, _data("freelance", f"f{i}@example.com", nom))
        _profil(client, h, competences="Python", visible_aux_entreprises=True)
    h_ent = _entreprise(client)

    r = client.get("/api/talents?limit=2", headers=h_ent)
    assert [t["nom"] for t in r.json()] == ["Alice", "Bob"]
    r = client.get("/api/talents?limit=2&offset=2", headers=h_ent)
    assert [t["nom"] for t in r.json()] == ["Carl"]


def test_talents_synonymes_de_competences(client):
    h_etu = _login(client, _data("etudiant", "etu@example.com", "Dev Web"))
    _profil(
        client, h_etu, competences="JavaScript, React", visible_aux_entreprises=True
    )
    h_ent = _entreprise(client)

    # "js" est un synonyme de JavaScript
    assert len(client.get("/api/talents?competence=js", headers=h_ent).json()) == 1
    # "java" est une autre competence : pas de faux positif sur "JavaScript"
    assert client.get("/api/talents?competence=java", headers=h_ent).json() == []
    # plusieurs competences : toutes requises
    r = client.get("/api/talents?competence=js&competence=reactjs", headers=h_ent)
    assert len(r.json()) == 1
    r = client.get("/api/talents?competence=js&competence=python", headers=h_ent)
    assert r.json() == []