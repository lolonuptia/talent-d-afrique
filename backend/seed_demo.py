"""Donnees de demonstration pour Talent d'Afrique (developpement uniquement).

Usage, depuis le dossier backend avec le venv active :
    python seed_demo.py            cree les donnees (refuse si deja presentes)
    python seed_demo.py --reset    supprime les donnees demo puis les recree
Tous les comptes demo : <identifiant>@demo.tiba / password
"""
import argparse
import os
import random
import sys
import uuid
from datetime import date, datetime, timedelta

from sqlalchemy import or_
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import engine
from app.core.security import hash_password
from app.models.candidature import Candidature
from app.models.certification import Certification
from app.models.entretien import Entretien
from app.models.favori import Favori
from app.models.message import Message
from app.models.notification import Notification
from app.models.offre import Offre
from app.models.portfolio import PortfolioItem
from app.models.profiles import (
    EcoleProfile,
    EntrepriseProfile,
    EtudiantProfile,
    FreelanceProfile,
)
from app.models.user import User

DOMAIN = "demo.tiba"
PASSWORD = "password"
CONSENT_VERSION = "2026-09-06"
NOW = datetime.utcnow()

# Les montants (remuneration mensuelle, TJM) sont indicatifs, en equivalent euros.

ENTREPRISES = [
    ("Baobab Digital", "baobab", "Technologie", "11-50", "Dakar, Senegal",
     "Studio de developpement web et mobile pour des clients en Afrique de l'Ouest.",
     "Equipe jeune, entraide, apprentissage continu."),
    ("Lagune Fintech", "lagune", "Finance", "50+", "Abidjan, Cote d'Ivoire",
     "Solutions de paiement mobile et de gestion financiere pour les PME.",
     "Rigueur, transparence et esprit d'equipe."),
    ("Atlas Logistique", "atlas", "Logistique", "50+", "Casablanca, Maroc",
     "Transport et chaine d'approvisionnement entre l'Afrique du Nord et l'Afrique de l'Ouest.",
     "Organisation, ponctualite, sens du service."),
    ("Savane Agritech", "savane", "Agriculture", "11-50", "Nairobi, Kenya",
     "Technologies pour aider les cooperatives agricoles a mieux vendre et mieux produire.",
     "Impact social, terrain, innovation."),
    ("Kivu Energie", "kivu", "Energie", "11-50", "Kigali, Rwanda",
     "Energie solaire hors reseau et suivi de la consommation par les donnees.",
     "Mission environnementale, autonomie, exigence technique."),
    ("Harmattan Media", "harmattan", "Communication", "1-10", "Lagos, Nigeria",
     "Agence de contenu et de marketing digital pour des marques africaines.",
     "Creativite, rythme soutenu, liberte d'initiative."),
]

ECOLES = [
    ("Ecole Horizon Numerique", "ecole.horizon", "Dakar, Senegal",
     "Ecole d'ingenieurs et de formations numeriques."),
    ("Institut Savane de Gestion", "ecole.savane", "Abidjan, Cote d'Ivoire",
     "Formations en gestion, finance et marketing."),
]

# nom, identifiant, competences, disponibilite, formations, ecole (index ou None), visible
ETUDIANTS = [
    ("Aminata Diallo", "aminata.diallo", "Python, SQL, FastAPI, Anglais", "immediate",
     "Licence 3 Informatique", 0, True),
    ("Moussa Ndiaye", "moussa.ndiaye", "JavaScript, React, TypeScript, Anglais", "1_mois",
     "Master 1 Genie logiciel", 0, True),
    ("Fatou Sow", "fatou.sow", "Excel, Comptabilite, Communication", "immediate",
     "Licence 3 Comptabilite et gestion", 1, True),
    ("Kofi Mensah", "kofi.mensah", "Marketing digital, Communication, Excel, Anglais", "3_mois",
     "Master 1 Marketing", 1, True),
    ("Awa Traore", "awa.traore", "Java, SQL, Django", "1_mois",
     "Licence 3 Informatique", 0, False),
    ("Ibrahim Kamara", "ibrahim.kamara", "Python, SQL, Excel", "6_mois",
     "Master 2 Statistiques", 0, True),
    ("Nadia Benali", "nadia.benali", "Gestion de projet, Communication, Excel, Anglais",
     "immediate", "Master 2 Management de projet", None, True),
    ("Chinedu Okafor", "chinedu.okafor", "React, Node.js, JavaScript, SQL", "1_mois",
     "Bootcamp developpeur web", None, True),
    ("Salma El Idrissi", "salma.elidrissi", "Marketing digital, Anglais, Communication",
     "3_mois", "Licence 3 Communication", 1, False),
    ("Jean-Claude Habimana", "jc.habimana", "Python, Django, SQL, Anglais", "immediate",
     "Licence 3 Informatique", None, True),
    ("Mariam Coulibaly", "mariam.coulibaly", "Comptabilite, Excel, Gestion de projet",
     "1_mois", "Master 1 Finance", 1, True),
    ("Samuel Mwangi", "samuel.mwangi", "TypeScript, React, Node.js, Anglais", "3_mois",
     "Master 1 Informatique", None, True),
]

# nom, identifiant, competences, tjm, disponibilite, annees, portfolio, visible
FREELANCES = [
    ("Cheikh Fall", "cheikh.fall", "Python, FastAPI, SQL, Anglais", 220, "immediate", 7,
     "https://portfolio.example.com/cheikh", True),
    ("Amina Yusuf", "amina.yusuf", "React, TypeScript, JavaScript", 260, "1_mois", 6,
     "https://portfolio.example.com/amina", True),
    ("Yves Kouadio", "yves.kouadio", "Java, SQL, Gestion de projet", 300, "3_mois", 10,
     "https://portfolio.example.com/yves", True),
    ("Leila Haddad", "leila.haddad", "Marketing digital, Communication, Anglais", 150,
     "immediate", 5, "https://portfolio.example.com/leila", True),
    ("Emeka Nwosu", "emeka.nwosu", "Node.js, JavaScript, SQL, Python", 180, "1_mois", 4,
     "https://portfolio.example.com/emeka", True),
    ("Grace Uwimana", "grace.uwimana", "Excel, Comptabilite, Gestion de projet", 130,
     "immediate", 8, None, False),
    ("Omar Benjelloun", "omar.benjelloun", "Django, Python, SQL", 240, "3_mois", 6,
     "https://portfolio.example.com/omar", True),
    ("Wanjiru Kamau", "wanjiru.kamau", "Marketing digital, Excel, Anglais", 120, "1_mois", 3,
     "https://portfolio.example.com/wanjiru", True),
]

# entreprise (index), titre, contrat, obligatoires, souhaitees, soft skills, niveau,
# disponibilite, localisation, remuneration, budget_tjm, statut
OFFRES = [
    (0, "Stage Developpeur Python / FastAPI", "stage", "Python, FastAPI", "SQL, Anglais",
     "Autonomie, Curiosite", "debutant", "immediate", "Dakar, Senegal", 350, None, "active"),
    (0, "Developpeur Full-Stack React / Node", "cdi", "React, Node.js, JavaScript",
     "TypeScript, SQL", "Travail en equipe", "junior", "1_mois", "Dakar, Senegal", 1200, None,
     "active"),
    (0, "Mission : API FastAPI pour application mobile", "mission", "Python, FastAPI, SQL",
     "Anglais", "Autonomie", "confirme", "immediate", "A distance", None, 250, "active"),
    (1, "Stage Analyste Comptable", "stage", "Comptabilite, Excel", "Anglais", "Rigueur",
     "debutant", "1_mois", "Abidjan, Cote d'Ivoire", 300, None, "active"),
    (1, "Data Analyst", "cdd", "SQL, Excel, Python", "Anglais",
     "Esprit d'analyse, Communication", "junior", "3_mois", "Abidjan, Cote d'Ivoire", 900,
     None, "active"),
    (1, "Mission : audit des processus financiers", "mission",
     "Comptabilite, Excel, Gestion de projet", "SQL", "Rigueur", "senior", "1_mois",
     "Abidjan, Cote d'Ivoire", None, 200, "active"),
    (2, "Stage Assistant chef de projet logistique", "stage", "Gestion de projet, Excel",
     "Anglais, Communication", "Organisation", "debutant", "immediate", "Casablanca, Maroc",
     400, None, "active"),
    (2, "Developpeur Java Backend", "cdi", "Java, SQL", "Gestion de projet", "Rigueur",
     "confirme", "3_mois", "Casablanca, Maroc", 1500, None, "active"),
    (2, "Mission : tableau de bord SQL / Excel", "mission", "SQL, Excel", "Python",
     "Autonomie", "junior", "immediate", "A distance", None, 160, "active"),
    (3, "Stage Marketing digital", "stage", "Marketing digital, Communication",
     "Anglais, Excel", "Creativite", "debutant", "3_mois", "Nairobi, Kenya", 250, None,
     "active"),
    (3, "Charge de projet Agritech", "cdd", "Gestion de projet, Excel", "Python, Anglais",
     "Leadership", "confirme", "1_mois", "Nairobi, Kenya", 1100, None, "active"),
    (3, "Mission : automatisation de rapports en Python", "mission", "Python, SQL", "Django",
     "Autonomie", "junior", "immediate", "A distance", None, 190, "active"),
    (4, "Developpeur Django", "cdi", "Django, Python, SQL", "FastAPI, Anglais", "Rigueur",
     "junior", "1_mois", "Kigali, Rwanda", 1300, None, "active"),
    (4, "Stage Data pour l'energie", "stage", "Python, SQL, Excel", "Anglais", "Curiosite",
     "debutant", "6_mois", "Kigali, Rwanda", 300, None, "active"),
    (5, "Community manager", "cdd", "Marketing digital, Communication", "Anglais",
     "Creativite", "junior", "immediate", "Lagos, Nigeria", 800, None, "active"),
    (5, "Mission : refonte d'un site vitrine", "mission", "React, JavaScript, TypeScript",
     "Node.js", "Autonomie", "confirme", "1_mois", "A distance", None, 280, "active"),
    (2, "Stage Redaction de contenu logistique", "stage", "Communication", "Anglais",
     "Creativite", "debutant", "1_mois", "Casablanca, Maroc", 250, None, "archivee"),
    (5, "Stage Social media (expiree)", "stage", "Marketing digital", "Communication",
     "Creativite", "debutant", "immediate", "Lagos, Nigeria", 200, None, "expiree"),
]

CERTIFICATIONS = [
    ("AWS Cloud Practitioner", "Amazon Web Services"),
    ("Google Data Analytics", "Google"),
    ("Scrum Master (PSM I)", "Scrum.org"),
    ("Certification Excel avance", "Institut de formation bureautique"),
    ("Marketing digital - fondamentaux", "Ecole du numerique"),
    ("TOEIC 850", "ETS"),
    ("Python Institute PCAP", "Python Institute"),
]

PROJETS = [
    ("Application de gestion de stock", "Application web pour une boutique de quartier."),
    ("Site vitrine pour une cooperative", "Site responsive avec catalogue de produits."),
    ("Tableau de bord de ventes", "Suivi des ventes hebdomadaires avec graphiques."),
    ("API de paiement mobile (maquette)", "API REST pour simuler des paiements."),
    ("Campagne reseaux sociaux", "Campagne de lancement pour une marque de cosmetiques."),
]

MESSAGES = [
    ("ent", "Bonjour {prenom}, merci pour votre candidature. Seriez-vous disponible pour un "
            "echange cette semaine ?"),
    ("tal", "Bonjour, avec plaisir. Je suis disponible jeudi apres-midi."),
    ("ent", "Parfait, je vous envoie les details de l'entretien."),
]


def _in(colonne, ids):
    return colonne.in_(list(ids) or [uuid.uuid4()])


def purge(db):
    users = db.query(User).filter(User.email.like(f"%@{DOMAIN}")).all()
    uids = [u.id for u in users]
    if not uids:
        return
    ent_ids = [
        p.id for p in db.query(EntrepriseProfile).filter(_in(EntrepriseProfile.user_id, uids))
    ]
    offre_ids = [o.id for o in db.query(Offre).filter(_in(Offre.entreprise_id, ent_ids))]
    cand_ids = [
        c.id
        for c in db.query(Candidature).filter(
            or_(_in(Candidature.candidat_id, uids), _in(Candidature.offre_id, offre_ids))
        )
    ]
    d = {"synchronize_session": False}
    db.query(Message).filter(_in(Message.candidature_id, cand_ids)).delete(**d)
    db.query(Entretien).filter(_in(Entretien.candidature_id, cand_ids)).delete(**d)
    db.query(Candidature).filter(_in(Candidature.id, cand_ids)).delete(**d)
    db.query(Favori).filter(
        or_(_in(Favori.user_id, uids), _in(Favori.offre_id, offre_ids))
    ).delete(**d)
    db.query(Notification).filter(_in(Notification.user_id, uids)).delete(**d)
    db.query(Certification).filter(_in(Certification.user_id, uids)).delete(**d)
    db.query(PortfolioItem).filter(_in(PortfolioItem.user_id, uids)).delete(**d)
    db.query(Offre).filter(_in(Offre.id, offre_ids)).delete(**d)
    db.query(EtudiantProfile).filter(_in(EtudiantProfile.user_id, uids)).delete(**d)
    db.query(FreelanceProfile).filter(_in(FreelanceProfile.user_id, uids)).delete(**d)
    db.query(EntrepriseProfile).filter(_in(EntrepriseProfile.user_id, uids)).delete(**d)
    db.query(EcoleProfile).filter(_in(EcoleProfile.user_id, uids)).delete(**d)
    db.query(User).filter(_in(User.id, uids)).delete(**d)
    db.commit()
    print(f"Anciennes donnees demo supprimees ({len(uids)} comptes).")


def _mots(texte):
    return {x.strip().lower() for x in (texte or "").split(",") if x.strip()}


def creer(db):
    rng = random.Random(2026)
    mdp = hash_password(PASSWORD)

    def nouveau_user(nom, identifiant, type_profil, jours_max=150):
        cree = NOW - timedelta(days=rng.randint(5, jours_max), hours=rng.randint(0, 23))
        u = User(
            id=uuid.uuid4(), nom=nom, email=f"{identifiant}@{DOMAIN}", mot_de_passe_hash=mdp,
            type_profil=type_profil, is_admin=False, consent_given_at=cree,
            consent_version=CONSENT_VERSION, created_at=cree, is_active=True,
        )
        db.add(u)
        return u

    # ----- Ecoles -----
    ecoles = []
    for nom, ident, loc, desc in ECOLES:
        u = nouveau_user(nom, ident, "ecole")
        db.flush()
        p = EcoleProfile(id=uuid.uuid4(), user_id=u.id, nom_etablissement=nom,
                         description=desc, localisation=loc)
        db.add(p)
        ecoles.append(p)
    db.flush()

    # ----- Entreprises -----
    entreprises = []
    for nom, ident, secteur, taille, loc, desc, culture in ENTREPRISES:
        u = nouveau_user(nom, ident, "entreprise")
        db.flush()
        p = EntrepriseProfile(id=uuid.uuid4(), user_id=u.id, description=desc, secteur=secteur,
                              taille=taille, culture=culture, localisation=loc)
        db.add(p)
        entreprises.append((u, p))
    db.flush()

    # ----- Talents -----
    talents = []  # (user, competences, type_profil)
    for nom, ident, comp, dispo, formation, ecole_idx, visible in ETUDIANTS:
        u = nouveau_user(nom, ident, "etudiant")
        db.flush()
        db.add(EtudiantProfile(
            id=uuid.uuid4(), user_id=u.id,
            ecole_id=ecoles[ecole_idx].id if ecole_idx is not None else None,
            competences=comp, formations=formation, disponibilite=dispo,
            experiences="Projets universitaires et un stage d'ete.",
            preferences="Stage ou premier emploi en Afrique.",
            visible_aux_entreprises=visible,
        ))
        talents.append((u, comp, "etudiant"))
    for nom, ident, comp, tjm, dispo, annees, portfolio, visible in FREELANCES:
        u = nouveau_user(nom, ident, "freelance")
        db.flush()
        db.add(FreelanceProfile(
            id=uuid.uuid4(), user_id=u.id, competences=comp, tjm=tjm, disponibilite=dispo,
            portfolio_url=portfolio, annees_experience=annees,
            visible_aux_entreprises=visible,
        ))
        talents.append((u, comp, "freelance"))
    db.flush()

    # ----- Offres -----
    offres = []
    for (ei, titre, contrat, obl, sou, soft, niveau, dispo, loc, remu, tjm, statut) in OFFRES:
        cree = NOW - timedelta(days=rng.randint(35, 60), hours=rng.randint(0, 23))
        o = Offre(
            id=uuid.uuid4(), entreprise_id=entreprises[ei][1].id, titre=titre,
            description=f"{titre} chez {ENTREPRISES[ei][0]}. Rejoignez une equipe ambitieuse.",
            type_contrat=contrat, competences_obligatoires=obl, competences_souhaitees=sou,
            soft_skills=soft, niveau_experience=niveau, disponibilite=dispo, localisation=loc,
            remuneration=remu, budget_tjm=tjm, statut=statut, created_at=cree, updated_at=cree,
        )
        db.add(o)
        offres.append(o)
    db.flush()
    actives = [o for o in offres if o.statut == "active"]

    # ----- Certifications et portfolio -----
    for i, (u, _comp, type_profil) in enumerate(talents):
        if i % 2 == 0:
            for titre, organisme in rng.sample(CERTIFICATIONS, rng.randint(1, 2)):
                db.add(Certification(
                    id=uuid.uuid4(), user_id=u.id, intitule=titre, organisme=organisme,
                    date_obtention=date.today() - timedelta(days=rng.randint(60, 900)),
                    url_verification=f"https://verif.example.com/{uuid.uuid4().hex[:8]}",
                ))
        nb = 2 if type_profil == "freelance" else (1 if i % 3 == 0 else 0)
        for titre, desc in rng.sample(PROJETS, nb):
            db.add(PortfolioItem(
                id=uuid.uuid4(), user_id=u.id, titre=titre, description=desc,
                url=f"https://projets.example.com/{uuid.uuid4().hex[:8]}",
            ))

    # ----- Candidatures, entretiens, messages, notifications -----
    nb_cand = 0
    for u, comp, type_profil in talents:
        types_ok = ("stage", "cdd", "cdi") if type_profil == "etudiant" else ("mission", "cdd")
        candidates = [
            o for o in actives
            if o.type_contrat in types_ok and _mots(comp) & _mots(o.competences_obligatoires)
        ]
        if not candidates:
            continue
        for offre in rng.sample(candidates, min(len(candidates), rng.randint(1, 3))):
            statut = rng.choices(
                ["recue", "en_cours", "entretien", "refusee", "acceptee"],
                weights=[35, 25, 15, 15, 10],
            )[0]
            cree = NOW - timedelta(days=rng.randint(3, 30), hours=rng.randint(0, 23))
            cand = Candidature(
                id=uuid.uuid4(), offre_id=offre.id, candidat_id=u.id,
                message="Bonjour, votre offre correspond a mon profil. Merci de votre retour.",
                statut=statut, created_at=cree, updated_at=cree + timedelta(hours=18),
            )
            db.add(cand)
            db.flush()
            nb_cand += 1
            ent_user = entreprises[OFFRES[offres.index(offre)][0]][0]

            db.add(Notification(
                id=uuid.uuid4(), user_id=ent_user.id, titre="Nouvelle candidature recue",
                message=f"Vous avez recu une candidature pour l'offre {offre.titre}.",
                type_evenement="candidature_recue", lue=rng.random() < 0.6, created_at=cree,
            ))
            if statut != "recue":
                db.add(Notification(
                    id=uuid.uuid4(), user_id=u.id, titre="Mise a jour de votre candidature",
                    message=f"Votre candidature pour {offre.titre} est passee au statut "
                            f"{statut}.",
                    type_evenement="statut_change", lue=rng.random() < 0.5,
                    created_at=cree + timedelta(hours=18),
                ))

            avec_entretien = statut == "entretien" or (
                statut in ("acceptee", "refusee") and rng.random() < 0.5
            )
            if avec_entretien:
                futur = statut == "entretien"
                quand = (NOW + timedelta(days=rng.randint(2, 14)) if futur
                         else NOW - timedelta(days=rng.randint(2, 10)))
                quand = quand.replace(hour=rng.randint(9, 16), minute=0, second=0,
                                      microsecond=0)
                mode = rng.choice(["visio", "visio", "presentiel", "telephone"])
                db.add(Entretien(
                    id=uuid.uuid4(), candidature_id=cand.id, date_heure=quand,
                    duree_minutes=rng.choice([30, 45, 60]), mode=mode,
                    lieu_ou_lien=(f"https://meet.example.com/demo-{uuid.uuid4().hex[:6]}"
                                  if mode == "visio" else None),
                    message="Merci de preparer une courte presentation de votre parcours.",
                    statut="planifie" if futur else "termine", created_at=cree,
                    updated_at=cree,
                ))
                db.add(Notification(
                    id=uuid.uuid4(), user_id=u.id, titre="Entretien planifie",
                    message=f"Un entretien a ete planifie pour l'offre {offre.titre}.",
                    type_evenement="entretien_planifie", lue=not futur,
                    created_at=cree + timedelta(hours=20),
                ))
                for k, (qui, texte) in enumerate(MESSAGES):
                    exp = ent_user if qui == "ent" else u
                    dest = u if qui == "ent" else ent_user
                    quand_msg = cree + timedelta(hours=22 + 5 * k)
                    db.add(Message(
                        id=uuid.uuid4(), candidature_id=cand.id, expediteur_id=exp.id,
                        contenu=texte.format(prenom=u.nom.split()[0]), lue=rng.random() < 0.7,
                        created_at=quand_msg,
                    ))
                    db.add(Notification(
                        id=uuid.uuid4(), user_id=dest.id, titre="Nouveau message",
                        message=f"{exp.nom} vous a ecrit au sujet de l'offre {offre.titre}.",
                        type_evenement="message_recu", lue=rng.random() < 0.5,
                        created_at=quand_msg,
                    ))

    # ----- Favoris -----
    for u, comp, type_profil in talents:
        for offre in rng.sample(actives, rng.randint(1, 3)):
            db.add(Favori(id=uuid.uuid4(), user_id=u.id, offre_id=offre.id,
                          created_at=NOW - timedelta(days=rng.randint(0, 20))))

    db.commit()
    print(f"Donnees demo creees : {len(ENTREPRISES)} entreprises, {len(ECOLES)} ecoles, "
          f"{len(talents)} talents, {len(offres)} offres, {nb_cand} candidatures.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true",
                        help="supprime les donnees demo existantes avant de les recreer")
    args = parser.parse_args()

    env = str(getattr(settings, "environment", None)
              or os.environ.get("ENVIRONMENT", "development")).lower()
    if env in ("production", "prod", "test"):
        sys.exit(f"Refus : environnement '{env}'. Ce script est reserve au developpement.")

    print("Base ciblee :", engine.url.render_as_string(hide_password=True))
    db = sessionmaker(bind=engine)()
    try:
        existe = db.query(User).filter(User.email.like(f"%@{DOMAIN}")).count()
        if existe and not args.reset:
            print(f"{existe} comptes demo existent deja. Relancez avec --reset pour les refaire.")
            return
        if existe:
            purge(db)
        creer(db)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()