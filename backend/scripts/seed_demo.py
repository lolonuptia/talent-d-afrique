"""Seed de demo coherent : python -m scripts.seed_demo"""
import importlib
import pkgutil
from datetime import datetime, timedelta

import app.models
from app.core.database import SessionLocal
from app.core.security import hash_password

for m in pkgutil.iter_modules(app.models.__path__):
    importlib.import_module(f"app.models.{m.name}")

from app.models.profiles import EcoleProfile, EntrepriseProfile, EtudiantProfile, FreelanceProfile
from app.models.user import User

MOT_DE_PASSE = "Passeword@123"

ECOLES = [
    ("ecole.ism@example.com", "ISM Dakar - Service insertion", "Institut Superieur de Management", "Dakar, Senegal",
     "Ecole de management et de commerce, formations en gestion, marketing et finance."),
    ("ecole.esp@example.com", "ESP Dakar - Bureau des stages", "Ecole Superieure Polytechnique", "Dakar, Senegal",
     "Ecole d'ingenieurs : genie informatique, telecoms, genie civil."),
    ("ecole.ucad@example.com", "UCAD - Cellule insertion", "Universite Cheikh Anta Diop", "Dakar, Senegal",
     "Universite publique : sciences, droit, lettres et sciences economiques."),
]

ENTREPRISES = [
    ("rh.baobabtech@example.com", "Baobab Tech", "Technologie", "11-50", "Dakar, Senegal",
     "Studio de developpement web et mobile pour les PME africaines.",
     "Equipe jeune, travail hybride, forte culture d'apprentissage."),
    ("rh.teranga-logistics@example.com", "Teranga Logistics", "Logistique et transport", "50+", "Dakar, Senegal",
     "Transport et gestion de la chaine d'approvisionnement en Afrique de l'Ouest.",
     "Rigueur, esprit d'equipe et sens du service client."),
    ("rh.afripay@example.com", "AfriPay Solutions", "Fintech", "11-50", "Abidjan, Cote d'Ivoire",
     "Solutions de paiement mobile et de transfert d'argent pour l'Afrique francophone.",
     "Innovation, agilite, impact financier et social."),
    ("rh.sahelagro@example.com", "Sahel Agro Industries", "Agroalimentaire", "50+", "Thies, Senegal",
     "Transformation et distribution de produits agricoles locaux.",
     "Ancrage local, qualite, developpement durable."),
    ("rh.korastudio@example.com", "Kora Studio", "Marketing et design", "1-10", "Dakar, Senegal",
     "Agence creative : identite visuelle, reseaux sociaux, production video.",
     "Creativite, liberte et projets varies."),
]

# (email, nom, ecole_email, competences, formations, experiences, disponibilite, visible)
ETUDIANTS = [
    ("awa.diop@example.com", "Awa Diop", "ecole.esp@example.com",
     "Python, FastAPI, SQL, Git", "Diplome d'ingenieur - Genie informatique (ESP, 3e annee)",
     "Stage de 2 mois : API de gestion de stock chez une startup locale.", "immediate", True),
    ("moussa.ndiaye@example.com", "Moussa Ndiaye", "ecole.esp@example.com",
     "React, TypeScript, Tailwind, Node.js", "Licence Pro - Developpement web (ESP)",
     "Projet de fin d'annee : plateforme de reservation en ligne.", "1_mois", True),
    ("fatou.sow@example.com", "Fatou Sow", "ecole.ism@example.com",
     "Marketing digital, Canva, SEO, Reseaux sociaux", "Master 1 - Marketing et communication (ISM)",
     "Stage community manager de 3 mois dans une agence de communication.", "immediate", True),
    ("ibrahima.fall@example.com", "Ibrahima Fall", "ecole.ism@example.com",
     "Comptabilite, Excel, Gestion financiere", "Licence 3 - Finance et comptabilite (ISM)",
     "Stage de 2 mois au service comptabilite d'une PME.", "3_mois", True),
    ("aminata.ba@example.com", "Aminata Ba", "ecole.ucad@example.com",
     "Analyse de donnees, Excel, Power BI, SQL", "Master 1 - Statistiques et econometrie (UCAD)",
     "Stage d'analyse de donnees dans un institut de sondage.", "1_mois", True),
    ("cheikh.sarr@example.com", "Cheikh Sarr", "ecole.ucad@example.com",
     "Droit des affaires, Redaction juridique", "Master 2 - Droit des affaires (UCAD)",
     "Stage de 3 mois dans un cabinet d'avocats.", "6_mois", False),
    ("khadija.diallo@example.com", "Khadija Diallo", "ecole.esp@example.com",
     "Java, Kotlin, Android, Firebase", "Diplome d'ingenieur - Telecoms et reseaux (ESP, 2e annee)",
     "Application Android de suivi de bus, projet universitaire.", "3_mois", True),
    ("ousmane.gueye@example.com", "Ousmane Gueye", "ecole.ism@example.com",
     "Gestion de projet, Logistique, Anglais courant", "Licence 3 - Logistique et transport (ISM)",
     "Stage de 2 mois en gestion d'entrepot dans une entreprise de transport.", "immediate", True),
]

# (email, nom, competences, tjm FCFA, disponibilite, portfolio, annees, visible)
FREELANCES = [
    ("mamadou.sy@example.com", "Mamadou Sy", "React, Node.js, PostgreSQL, Docker", 60000.0, "immediate",
     "https://portfolio-mamadou-sy.example.com", 6, True),
    ("ndeye.thiam@example.com", "Ndeye Coumba Thiam", "UI/UX, Figma, Design system, Prototypage", 45000.0, "1_mois",
     "https://ndeyethiam-design.example.com", 4, True),
    ("pape.kane@example.com", "Pape Samba Kane", "Data analyse, Python, Power BI, SQL", 55000.0, "immediate",
     "https://papekane-data.example.com", 5, True),
    ("rokhaya.mbaye@example.com", "Rokhaya Mbaye", "Redaction web, SEO, Strategie de contenu", 30000.0, "3_mois",
     "https://rokhaya-redaction.example.com", 3, False),
]


def verifie():
    return datetime.utcnow() - timedelta(days=30)


def creer_user(db, email, nom, type_profil, admin=False):
    user = db.query(User).filter(User.email == email).first()
    if user is not None:
        return None
    user = User(
        nom=nom, email=email, mot_de_passe_hash=hash_password(MOT_DE_PASSE), type_profil=type_profil,
        is_admin=admin, is_active=True, consent_given_at=datetime.utcnow(), consent_version="seed",
        email_verifie_at=verifie(),
    )
    db.add(user)
    db.flush()
    return user


def main():
    db = SessionLocal()
    crees, ignores = [], []
    try:
        u = creer_user(db, "admin.tiba@example.com", "Administrateur TIBA", "ecole", admin=True)
        (crees if u else ignores).append(("admin", "admin.tiba@example.com"))

        ecoles = {}
        for email, nom, etab, loc, desc in ECOLES:
            u = creer_user(db, email, nom, "ecole")
            if u is None:
                ignores.append(("ecole", email))
                p = db.query(EcoleProfile).join(User, EcoleProfile.user_id == User.id).filter(User.email == email).first()
                if p:
                    ecoles[email] = p
                continue
            p = EcoleProfile(user_id=u.id, nom_etablissement=etab, description=desc, localisation=loc)
            db.add(p)
            db.flush()
            ecoles[email] = p
            crees.append(("ecole", email))

        for email, nom, secteur, taille, loc, desc, culture in ENTREPRISES:
            u = creer_user(db, email, nom, "entreprise")
            if u is None:
                ignores.append(("entreprise", email))
                continue
            db.add(EntrepriseProfile(user_id=u.id, description=desc, secteur=secteur, taille=taille,
                                     culture=culture, localisation=loc))
            crees.append(("entreprise", email))

        for email, nom, ecole_email, comp, form, exp, dispo, visible in ETUDIANTS:
            u = creer_user(db, email, nom, "etudiant")
            if u is None:
                ignores.append(("etudiant", email))
                continue
            ecole = ecoles.get(ecole_email)
            db.add(EtudiantProfile(user_id=u.id, ecole_id=ecole.id if ecole else None, competences=comp,
                                   formations=form, experiences=exp, disponibilite=dispo,
                                   visible_aux_entreprises=visible))
            crees.append(("etudiant", email))

        for email, nom, comp, tjm, dispo, portfolio, annees, visible in FREELANCES:
            u = creer_user(db, email, nom, "freelance")
            if u is None:
                ignores.append(("freelance", email))
                continue
            db.add(FreelanceProfile(user_id=u.id, competences=comp, tjm=tjm, disponibilite=dispo,
                                    portfolio_url=portfolio, annees_experience=annees,
                                    visible_aux_entreprises=visible))
            crees.append(("freelance", email))

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    print(f"Crees : {len(crees)}   Deja presents : {len(ignores)}")
    print(f"Mot de passe de tous les comptes : {MOT_DE_PASSE}\n")
    for role, email in crees + ignores:
        print(f"  {role:<11} {email}")


if __name__ == "__main__":
    main()