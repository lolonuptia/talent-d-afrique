"""Tests du dashboard entreprise : candidatures recues, offres, entretiens, emails, RGPD."""

from datetime import datetime, timedelta

from app.models.candidature import Candidature
from app.models.offre import Offre
from app.models.user import User
from app.services.purge import purger_comptes_supprimes


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


def _futur(jours=3):
    return (datetime.utcnow() + timedelta(days=jours)).isoformat()


def _scenario(client):
    """Entreprise + offre + etudiant qui postule. Renvoie (h_ent, h_etu, cand_id, offre_id)."""
    h_ent = _login(client, _data("entreprise", "ent@example.com", "Entreprise"))
    client.put("/api/profiles/me", headers=h_ent, json={"secteur": "Tech"})
    r = client.post(
        "/api/offres",
        headers=h_ent,
        json={
            "titre": "Stage Python",
            "type_contrat": "stage",
            "competences_obligatoires": "python",
        },
    )
    assert r.status_code == 201, r.text
    offre_id = r.json()["id"]

    h_etu = _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    r = client.post("/api/candidatures", headers=h_etu, json={"offre_id": offre_id})
    assert r.status_code == 201, r.text
    return h_ent, h_etu, r.json()["id"], offre_id


def _planifier(client, h_ent, cand_id, jours=3):
    r = client.post(
        "/api/entretiens",
        headers=h_ent,
        json={"candidature_id": cand_id, "date_heure": _futur(jours)},
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


def test_candidatures_recues_avec_noms(client):
    h_ent, _, _, _ = _scenario(client)
    r = client.get("/api/candidatures/recues", headers=h_ent)
    assert r.status_code == 200, r.text
    lignes = r.json()
    assert len(lignes) == 1
    assert lignes[0]["candidat_nom"] == "Aminata"
    assert lignes[0]["offre_titre"] == "Stage Python"


def test_candidatures_recues_droits_et_isolation(client):
    h_ent, h_etu, _, _ = _scenario(client)
    assert client.get("/api/candidatures/recues", headers=h_etu).status_code == 403
    assert client.get("/api/candidatures/recues").status_code == 401

    # une autre entreprise ne voit rien (avec ou sans profil)
    h_autre = _login(client, _data("entreprise", "autre@example.com", "Autre"))
    assert client.get("/api/candidatures/recues", headers=h_autre).json() == []
    client.put("/api/profiles/me", headers=h_autre, json={"secteur": "Finance"})
    assert client.get("/api/candidatures/recues", headers=h_autre).json() == []


def test_classement_contient_le_nom_du_candidat(client):
    h_ent, _, _, offre_id = _scenario(client)
    r = client.get(f"/api/candidatures/offre/{offre_id}/classees", headers=h_ent)
    assert r.status_code == 200, r.text
    assert r.json()[0]["candidat_nom"] == "Aminata"


def test_suppression_offre_avec_candidatures_refusee(client):
    h_ent, _, _, offre_id = _scenario(client)
    assert client.delete(f"/api/offres/{offre_id}", headers=h_ent).status_code == 400
    assert client.get(f"/api/offres/{offre_id}").status_code == 200

    r = client.patch(f"/api/offres/{offre_id}", headers=h_ent, json={"statut": "archivee"})
    assert r.status_code == 200 and r.json()["statut"] == "archivee"


def test_suppression_offre_sans_candidature(client):
    h_ent = _login(client, _data("entreprise", "ent@example.com", "Entreprise"))
    client.put("/api/profiles/me", headers=h_ent, json={"secteur": "Tech"})
    offre_id = client.post(
        "/api/offres", headers=h_ent, json={"titre": "Sans candidat", "type_contrat": "cdi"}
    ).json()["id"]
    assert client.delete(f"/api/offres/{offre_id}", headers=h_ent).status_code == 204
    assert client.get(f"/api/offres/{offre_id}").status_code == 404


def test_annulation_entretien_remet_la_candidature_en_cours(client):
    h_ent, h_etu, cand_id, _ = _scenario(client)
    e_id = _planifier(client, h_ent, cand_id)
    assert client.get("/api/candidatures/mine", headers=h_etu).json()[0]["statut"] == "entretien"

    r = client.patch(f"/api/entretiens/{e_id}", headers=h_ent, json={"statut": "annule"})
    assert r.status_code == 200, r.text
    assert client.get("/api/candidatures/mine", headers=h_etu).json()[0]["statut"] == "en_cours"


def test_annulation_garde_le_statut_si_autre_entretien_planifie(client):
    h_ent, h_etu, cand_id, _ = _scenario(client)
    e1 = _planifier(client, h_ent, cand_id, 3)
    _planifier(client, h_ent, cand_id, 5)
    client.patch(f"/api/entretiens/{e1}", headers=h_ent, json={"statut": "annule"})
    assert client.get("/api/candidatures/mine", headers=h_etu).json()[0]["statut"] == "entretien"


def test_emails_insensibles_a_la_casse(client):
    data = _data("entreprise", "Casse@Example.com", "Casse")
    assert client.post("/api/auth/register", json=data).status_code == 201
    client.cookies.clear()

    r = client.post(
        "/api/auth/login",
        json={"email": "CASSE@example.COM", "mot_de_passe": "motdepasse123"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["user"]["email"] == "casse@example.com"
    client.cookies.clear()

    doublon = _data("entreprise", "casse@EXAMPLE.com", "Autre")
    assert client.post("/api/auth/register", json=doublon).status_code == 400


def test_changement_email_deja_pris(client):
    h1 = _login(client, _data("entreprise", "a@example.com", "Alpha"))
    _login(client, _data("entreprise", "b@example.com", "Beta"))

    r = client.patch(
        "/api/users/me",
        headers=h1,
        json={"email": "B@example.com", "mot_de_passe_actuel": "motdepasse123"},
    )
    assert r.status_code == 400
    r = client.patch(
        "/api/users/me",
        headers=h1,
        json={"email": "c@example.com", "mot_de_passe_actuel": "motdepasse123"},
    )
    assert r.status_code == 200 and r.json()["email"] == "c@example.com"


def test_export_rgpd_complet(client):
    h_ent, h_etu, cand_id, _ = _scenario(client)
    _planifier(client, h_ent, cand_id)
    r = client.post(f"/api/messages/{cand_id}", headers=h_ent, json={"contenu": "Bonjour"})
    assert r.status_code == 201, r.text

    ent = client.get("/api/users/me/export", headers=h_ent).json()
    assert "mot_de_passe_hash" not in str(ent)
    assert ent["compte"]["email"] == "ent@example.com"
    assert ent["profil"]["secteur"] == "Tech"
    assert len(ent["offres"]) == 1
    assert len(ent["candidatures"]) == 1
    assert len(ent["entretiens"]) == 1
    assert len(ent["messages"]) == 1

    etu = client.get("/api/users/me/export", headers=h_etu).json()
    assert etu["offres"] == []
    assert len(etu["candidatures"]) == 1
    assert len(etu["messages"]) == 1
    assert len(etu["notifications"]) >= 1


def test_purge_compte_talent_apres_30_jours(client, db_session):
    h_ent, h_etu, cand_id, _ = _scenario(client)
    client.post(f"/api/messages/{cand_id}", headers=h_etu, json={"contenu": "Merci"})
    assert client.delete("/api/users/me", headers=h_etu).status_code == 204

    assert purger_comptes_supprimes(db_session) == 0  # trop tot
    dans_31_jours = datetime.utcnow() + timedelta(days=31)
    assert purger_comptes_supprimes(db_session, maintenant=dans_31_jours) == 1

    assert db_session.query(User).filter(User.email == "etu@example.com").count() == 0
    assert db_session.query(Candidature).count() == 0
    assert db_session.query(Offre).count() == 1  # l'offre de l'entreprise reste
    assert client.get("/api/offres/mine", headers=h_ent).status_code == 200


def test_purge_compte_entreprise_supprime_ses_offres(client, db_session):
    h_ent, _, _, _ = _scenario(client)
    assert client.delete("/api/users/me", headers=h_ent).status_code == 204

    dans_31_jours = datetime.utcnow() + timedelta(days=31)
    assert purger_comptes_supprimes(db_session, maintenant=dans_31_jours) == 1

    assert db_session.query(Offre).count() == 0
    assert db_session.query(Candidature).count() == 0
    assert db_session.query(User).filter(User.email == "etu@example.com").count() == 1
