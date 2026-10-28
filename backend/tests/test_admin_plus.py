"""Admin avance : fiche, roles, deconnexion forcee, purge, annonces, exports, journal."""

import time
import uuid

from app.models.admin_log import AdminLog
from app.models.candidature import Candidature
from app.models.notification import Notification
from app.models.user import User

MDP = "motdepasse123"


def _data(type_profil, email, nom="Test"):
    return {
        "nom": nom,
        "email": email,
        "mot_de_passe": MDP,
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
    client.cookies.clear()
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _admin(client, db_session, email="admin@example.com"):
    h = _login(client, _data("ecole", email, "Admin"))
    db_session.query(User).filter(User.email == email).update({User.is_admin: True})
    db_session.commit()
    return h


def _uid(db_session, email):
    db_session.expire_all()
    return str(db_session.query(User).filter(User.email == email).one().id)


def _entreprise_avec_offre(client, email="ent@example.com"):
    h = _login(client, _data("entreprise", email, "Entreprise"))
    client.put("/api/profiles/me", headers=h, json={"secteur": "Tech"})
    r = client.post(
        "/api/offres", headers=h, json={"titre": "Stage Python", "type_contrat": "stage"}
    )
    assert r.status_code == 201, r.text
    return h, r.json()["id"]


def _logs(db_session):
    db_session.expire_all()
    return db_session.query(AdminLog).order_by(AdminLog.created_at).all()


def test_acces_reserve_aux_admins(client):
    h = _login(client, _data("entreprise", "ent@example.com", "Entreprise"))
    uid = "00000000-0000-0000-0000-000000000001"
    chemins = ["/journal", "/export/utilisateurs.csv", "/export/offres.csv"]
    chemins.append(f"/utilisateurs/{uid}/fiche")
    for chemin in chemins:
        assert client.get(f"/api/admin{chemin}", headers=h).status_code == 403
        assert client.get(f"/api/admin{chemin}").status_code == 401
    corps = {"titre": "Test", "message": "Message", "cible": "tous"}
    assert client.post("/api/admin/annonces", headers=h, json=corps).status_code == 403
    url = f"/api/admin/utilisateurs/{uid}/deconnecter"
    assert client.post(url, headers=h).status_code == 403


def test_fiche_utilisateur(client, db_session):
    h = _admin(client, db_session)
    _entreprise_avec_offre(client)
    uid = _uid(db_session, "ent@example.com")
    r = client.get(f"/api/admin/utilisateurs/{uid}/fiche", headers=h)
    assert r.status_code == 200, r.text
    f = r.json()
    assert f["compte"]["email"] == "ent@example.com"
    assert f["statut"] == "actif"
    assert f["profil"]["secteur"] == "Tech"
    assert [o["titre"] for o in f["offres"]] == ["Stage Python"]
    assert "mot_de_passe_hash" not in r.text
    inconnu = client.get(f"/api/admin/utilisateurs/{uuid.uuid4()}/fiche", headers=h)
    assert inconnu.status_code == 404


def test_fiche_etudiant_sans_chemin_de_cv(client, db_session):
    h = _admin(client, db_session)
    h_etu = _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    client.put("/api/profiles/me", headers=h_etu, json={"competences": "Python"})
    uid = _uid(db_session, "etu@example.com")
    f = client.get(f"/api/admin/utilisateurs/{uid}/fiche", headers=h).json()
    assert f["profil"]["competences"] == "Python"
    assert "cv_url" not in f["profil"] and f["a_un_cv"] is False


def test_roles_admin(client, db_session):
    h = _admin(client, db_session)
    h_etu = _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    uid = _uid(db_session, "etu@example.com")
    url = f"/api/admin/utilisateurs/{uid}/role"
    stats = "/api/admin/statistiques"
    assert client.get(stats, headers=h_etu).status_code == 403

    faux = {"is_admin": True, "mot_de_passe": "faux-faux-faux"}
    assert client.patch(url, headers=h, json=faux).status_code == 400
    assert client.patch(url, headers=h, json={"is_admin": True}).status_code == 422
    r = client.patch(url, headers=h, json={"is_admin": True, "mot_de_passe": MDP})
    assert r.status_code == 200, r.text
    assert client.get(stats, headers=h_etu).status_code == 200

    r = client.patch(url, headers=h, json={"is_admin": False, "mot_de_passe": MDP})
    assert r.status_code == 200, r.text
    assert client.get(stats, headers=h_etu).status_code == 403
    actions = [log.action for log in _logs(db_session)]
    assert actions == ["promotion_admin", "retrait_admin"]


def test_role_protections(client, db_session):
    h = _admin(client, db_session)
    moi = _uid(db_session, "admin@example.com")
    corps = {"is_admin": False, "mot_de_passe": MDP}
    assert (
        client.patch(f"/api/admin/utilisateurs/{moi}/role", headers=h, json=corps).status_code
        == 400
    )

    _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    uid = _uid(db_session, "etu@example.com")
    client.patch(f"/api/admin/utilisateurs/{uid}/suspendre", headers=h)
    promo = {"is_admin": True, "mot_de_passe": MDP}
    r = client.patch(f"/api/admin/utilisateurs/{uid}/role", headers=h, json=promo)
    assert r.status_code == 400


def test_deconnexion_forcee(client, db_session):
    h = _admin(client, db_session)
    h_etu = _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    uid = _uid(db_session, "etu@example.com")
    moi = _uid(db_session, "admin@example.com")
    assert client.get("/api/auth/me", headers=h_etu).status_code == 200
    assert client.post(f"/api/admin/utilisateurs/{moi}/deconnecter", headers=h).status_code == 400

    time.sleep(1.2)  # les jetons portent une date a la seconde
    r = client.post(f"/api/admin/utilisateurs/{uid}/deconnecter", headers=h)
    assert r.status_code == 200, r.text
    assert client.get("/api/auth/me", headers=h_etu).status_code == 401
    assert [log.action for log in _logs(db_session)] == ["deconnexion_forcee"]


def test_lien_reinitialisation(client, db_session, monkeypatch):
    envoyes = []
    monkeypatch.setattr(
        "app.routers.admin_plus.envoyer_email_notification",
        lambda user, sujet, html: envoyes.append((user.email, html)),
    )
    h = _admin(client, db_session)
    h_etu = _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    uid = _uid(db_session, "etu@example.com")
    url = f"/api/admin/utilisateurs/{uid}/lien-reinitialisation"

    r = client.post(url, headers=h)
    assert r.status_code == 200, r.text
    assert "token" not in r.text
    assert envoyes[0][0] == "etu@example.com" and "reset-password?token=" in envoyes[0][1]

    assert client.delete("/api/users/me", headers=h_etu).status_code == 204
    assert client.post(url, headers=h).status_code == 400


def test_purge_immediate(client, db_session):
    h = _admin(client, db_session)
    _, offre_id = _entreprise_avec_offre(client)
    h_etu = _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    client.post("/api/candidatures", headers=h_etu, json={"offre_id": offre_id})
    uid = _uid(db_session, "etu@example.com")
    url = f"/api/admin/utilisateurs/{uid}/purger"
    bon = {"email_confirmation": "ETU@example.com", "mot_de_passe": MDP}

    mauvais_email = {"email_confirmation": "autre@example.com", "mot_de_passe": MDP}
    assert client.post(url, headers=h, json=mauvais_email).status_code == 400
    mauvais_mdp = {"email_confirmation": "etu@example.com", "mot_de_passe": "faux-faux-faux"}
    assert client.post(url, headers=h, json=mauvais_mdp).status_code == 400

    r = client.post(url, headers=h, json=bon)
    assert r.status_code == 200, r.text
    db_session.expire_all()
    assert db_session.query(User).filter(User.email == "etu@example.com").count() == 0
    assert db_session.query(Candidature).count() == 0
    [log] = _logs(db_session)
    assert log.action == "purge_compte" and "etu@example.com" not in (log.details or "")


def test_purge_interdite_sur_un_admin(client, db_session):
    h = _admin(client, db_session)
    _admin(client, db_session, "admin2@example.com")
    for email in ("admin@example.com", "admin2@example.com"):
        uid = _uid(db_session, email)
        corps = {"email_confirmation": email, "mot_de_passe": MDP}
        r = client.post(f"/api/admin/utilisateurs/{uid}/purger", headers=h, json=corps)
        assert r.status_code == 400


def test_annonce_ciblee(client, db_session):
    h = _admin(client, db_session)
    _login(client, _data("etudiant", "e1@example.com", "Un"))
    _login(client, _data("etudiant", "e2@example.com", "Deux"))
    _login(client, _data("entreprise", "ent@example.com", "Entreprise"))
    corps = {"titre": "Maintenance", "message": "Samedi soir.", "cible": "etudiant"}

    r = client.post("/api/admin/annonces", headers=h, json=corps)
    assert r.status_code == 200, r.text
    assert r.json()["destinataires"] == 2
    db_session.expire_all()
    notifs = db_session.query(Notification).filter(Notification.type_evenement == "annonce")
    assert notifs.count() == 2

    assert (
        client.post("/api/admin/annonces", headers=h, json={**corps, "titre": "ab"}).status_code
        == 422
    )
    vide = {**corps, "cible": "freelance"}
    assert client.post("/api/admin/annonces", headers=h, json=vide).status_code == 400


def test_exports_csv(client, db_session):
    h = _admin(client, db_session)
    _login(client, _data("etudiant", "etu@example.com", "=1+1"))
    _entreprise_avec_offre(client)

    r = client.get("/api/admin/export/utilisateurs.csv", headers=h)
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    assert "attachment" in r.headers["content-disposition"]
    texte = r.content.decode("utf-8-sig")
    assert texte.splitlines()[0].startswith("id;nom;email")
    assert "'=1+1" in texte and ";=1+1;" not in texte

    r = client.get("/api/admin/export/offres.csv", headers=h)
    assert "Stage Python" in r.content.decode("utf-8-sig")
    assert [log.action for log in _logs(db_session)] == ["export_donnees"] * 2


def test_journal_filtre(client, db_session):
    h = _admin(client, db_session)
    _login(client, _data("etudiant", "etu@example.com", "Aminata"))
    uid = _uid(db_session, "etu@example.com")
    client.patch(f"/api/admin/utilisateurs/{uid}/suspendre", headers=h)
    client.post(
        "/api/admin/annonces",
        headers=h,
        json={"titre": "Info", "message": "Bonjour a tous", "cible": "tous"},
    )

    assert len(client.get("/api/admin/journal", headers=h).json()) == 2
    seul = client.get("/api/admin/journal?action=annonce", headers=h).json()
    assert [x["action"] for x in seul] == ["annonce"]
    cible = client.get(f"/api/admin/journal?cible_id={uid}", headers=h).json()
    assert [x["action"] for x in cible] == ["suspension_compte"]
