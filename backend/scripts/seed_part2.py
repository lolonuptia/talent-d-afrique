import sys, os, pkgutil, importlib
from datetime import datetime, timedelta, date, timezone
sys.path.insert(0, os.getcwd())

import app.models as pkg
for m in pkgutil.iter_modules(pkg.__path__):
    importlib.import_module(f"app.models.{m.name}")
from app.core.database import Base, SessionLocal

C = {m.class_.__name__: m.class_ for m in Base.registry.mappers}
User, Profile = C["User"], C["EntrepriseProfile"]
Offre, Candidature, Entretien = C["Offre"], C["Candidature"], C["Entretien"]
Mission, Jalon, Note, Notif = C["Mission"], C["MissionJalon"], C["MissionNote"], C["Notification"]

def now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

db = SessionLocal()
print("Base cible :", db.get_bind().url.render_as_string(hide_password=True))
if os.environ.get("SEED_CONFIRM") != "oui":
    sys.exit("Annule.")

profiles = db.query(Profile).all()
users = {u.id: u for u in db.query(User).all()}
owner_ids = {getattr(p, "user_id", None) for p in profiles}

def pname(p):
    for a in ("nom_entreprise", "nom", "raison_sociale", "name", "company_name", "denomination"):
        v = getattr(p, a, None)
        if isinstance(v, str) and v:
            return v
    return ""

def pkey(p):
    u = users.get(getattr(p, "user_id", None))
    return (pname(p) + " " + (getattr(u, "email", "") or "")).lower()

cands = []
for u in users.values():
    email = (getattr(u, "email", "") or "").lower()
    role = str(getattr(u, "role", "") or "").lower()
    if u.id in owner_ids or email.startswith("admin") or "admin" in role or "entreprise" in role:
        continue
    cands.append(u)
print(f"{len(profiles)} entreprises, {len(cands)} candidats detectes")
if len(profiles) == 0 or len(cands) < 4:
    sys.exit("Pas assez de comptes detectes, arret.")

def S(titre, tc, desc, ob, so, ss, niv, dispo, loc, rem=None, tjm=None, np_=1):
    return dict(titre=titre, type_contrat=tc, description=desc, competences_obligatoires=ob,
                competences_souhaitees=so, soft_skills=ss, niveau_experience=niv,
                disponibilite=dispo, localisation=loc, remuneration=rem, budget_tjm=tjm, nombre_postes=np_)

CAT = {
 "baobab": [
  S("Développeur Full Stack", "cdi", "Développement de nos applications web et mobiles.", "Python, FastAPI, React", "Docker, PostgreSQL", "Autonomie, communication", "2-5 ans", "1_mois", "Dakar", rem=900000),
  S("Stagiaire Développeur Mobile", "stage", "Participation à l'app Android.", "Kotlin, Android", "Jetpack Compose", "Curiosité, rigueur", "Débutant", "immediate", "Dakar", rem=150000, np_=2),
  S("Mission refonte API", "mission", "Refonte de l'API REST existante.", "FastAPI, SQLAlchemy", "Tests, CI/CD", "Autonomie", "5 ans+", "immediate", "Remote", tjm=90000)],
 "teranga": [
  S("Chargé logistique", "cdi", "Pilotage des flux et des transporteurs.", "Gestion de stocks, Excel", "ERP", "Organisation, réactivité", "2-5 ans", "1_mois", "Dakar", rem=600000),
  S("Assistant supply chain", "stage", "Appui à l'équipe supply chain.", "Excel, suivi des commandes", "Power BI", "Rigueur", "Débutant", "immediate", "Dakar", rem=150000),
  S("Mission audit logistique", "mission", "Audit des entrepôts et recommandations.", "Audit, lean logistics", "Reporting", "Esprit de synthèse", "5 ans+", "3_mois", "Thiès", tjm=75000)],
 "afripay": [
  S("Analyste financier", "cdi", "Analyse des flux et reporting financier.", "Finance, Excel, SQL", "Power BI", "Esprit d'analyse", "2-5 ans", "1_mois", "Dakar", rem=800000),
  S("Développeur backend fintech", "cdd", "API de paiement mobile.", "Python, API REST", "Sécurité, PCI-DSS", "Rigueur", "2-5 ans", "immediate", "Dakar", rem=700000),
  S("Mission intégration paiement mobile", "mission", "Intégration Wave / Orange Money.", "API REST, webhooks", "Python", "Autonomie", "5 ans+", "immediate", "Remote", tjm=100000)],
}
GEN = [
 [S("Comptable", "cdi", "Tenue de la comptabilité générale.", "Comptabilité, SYSCOHADA", "Sage", "Rigueur", "2-5 ans", "1_mois", "Dakar", rem=550000),
  S("Stage Marketing Digital", "stage", "Animation des réseaux sociaux.", "Réseaux sociaux, Canva", "SEO", "Créativité", "Débutant", "immediate", "Dakar", rem=120000),
  S("Mission design UI/UX", "mission", "Maquettes de l'application.", "Figma, UX", "Design system", "Écoute", "2-5 ans", "immediate", "Remote", tjm=65000)],
 [S("Chargé RH", "cdi", "Recrutement et administration du personnel.", "Droit du travail, recrutement", "SIRH", "Empathie", "2-5 ans", "1_mois", "Dakar", rem=500000),
  S("Community Manager", "cdd", "Gestion des communautés en ligne.", "Rédaction, réseaux sociaux", "Vidéo", "Créativité", "Débutant", "immediate", "Dakar", rem=300000),
  S("Mission data analyse", "mission", "Tableaux de bord de pilotage.", "SQL, Power BI", "Python", "Autonomie", "2-5 ans", "immediate", "Remote", tjm=70000)],
]

def specs_for(i, p):
    k = pkey(p)
    for key, lst in CAT.items():
        if key in k:
            return list(lst)
    return list(GEN[i % len(GEN)])

EXTRA = [("expiree", "Offre expirée : "), ("pourvue", "Offre pourvue : "), ("archivee", "Offre archivée : ")]

created = dict(offres=0, cand=0, entr=0, miss=0, notif=0)
offers = []   # (offre, spec_type)
for i, p in enumerate(profiles):
    specs = specs_for(i, p)
    plan = [(s, "active", i % 5) for s in specs]
    st, pre = EXTRA[i % 3]
    base = dict(specs[0]); base["titre"] = pre + base["titre"]
    plan.append((base, st, 40 + i))
    if i == 0:  # un cas "pourvue" garanti
        b2 = dict(specs[1]); b2["titre"] = "Offre pourvue : " + b2["titre"]
        plan.append((b2, "pourvue", 60))
    for spec, statut, age in plan:
        o = db.query(Offre).filter_by(entreprise_id=p.id, titre=spec["titre"]).first()
        if not o:
            o = Offre(entreprise_id=p.id, statut=statut, created_at=now() - timedelta(days=age), **spec)
            db.add(o); db.flush(); created["offres"] += 1
        offers.append((o, p))

STAT = ["recue", "en_cours", "entretien", "refusee", "acceptee"]
MODES = ["visio", "presentiel", "telephone"]
ci = e = m = 0
for oi, (o, p) in enumerate(offers):
    if o.statut == "pourvue":
        seq = ["acceptee", "refusee", "refusee", "refusee"]
    elif o.statut in ("expiree", "archivee"):
        seq = ["recue", "refusee"]
    elif o.type_contrat == "mission":
        seq = ["acceptee", "entretien", "en_cours", "recue"]
    else:
        seq = [STAT[(oi + k) % 5] for k in range(4)]
    for k, statut in enumerate(seq):
        cand = cands[(ci + k) % len(cands)]
        c = db.query(Candidature).filter_by(offre_id=o.id, candidat_id=cand.id).first()
        if not c:
            c = Candidature(offre_id=o.id, candidat_id=cand.id, statut=statut,
                            message="Bonjour, je suis très intéressé(e) par ce poste.",
                            created_at=now() - timedelta(days=10 - k))
            db.add(c); db.flush(); created["cand"] += 1
            db.add(Notif(user_id=cand.id, titre="Mise à jour de votre candidature",
                         message=f"Votre candidature « {o.titre} » est : {statut}.",
                         type_evenement="statut_change", lue=(k % 2 == 0)))
            created["notif"] += 1
            if getattr(p, "user_id", None):
                db.add(Notif(user_id=p.user_id, titre="Nouvelle candidature",
                             message=f"Nouvelle candidature pour « {o.titre} ».",
                             type_evenement="candidature_recue", lue=False))
                created["notif"] += 1

        # entretiens
        if not db.query(Entretien).filter_by(candidature_id=c.id).first():
            ent = None
            if c.statut == "entretien":
                ent = "planifie" if e % 2 == 0 else "annule"
            elif c.statut == "acceptee":
                ent = "termine"
            elif c.statut == "en_cours" and e % 2 == 1:
                ent = "termine"
            if ent:
                future = ent in ("planifie",) or (ent == "annule" and e % 4 == 3)
                dt = (now() + timedelta(days=2 + e % 6)) if future else (now() - timedelta(days=3 + e % 7))
                dt = dt.replace(hour=10 + e % 5, minute=0, second=0, microsecond=0)
                mode = MODES[e % 3]
                lieu = {"visio": "https://meet.google.com/abc-defg-hij",
                        "presentiel": "Dakar, Plateau - siège de l'entreprise",
                        "telephone": "+221770000000"}[mode]
                db.add(Entretien(candidature_id=c.id, date_heure=dt, duree_minutes=[30, 45, 60][e % 3],
                                 mode=mode, lieu_ou_lien=lieu, fuseau="Africa/Dakar",
                                 message="Merci de vous connecter 5 minutes avant.", statut=ent))
                created["entr"] += 1
                e += 1

        # missions
        if c.statut == "acceptee" and o.type_contrat == "mission" \
                and not db.query(Mission).filter_by(candidature_id=c.id).first():
            st, av = [("en_cours", 45), ("en_pause", 30), ("terminee", 100), ("en_cours", 15)][m % 4]
            ms = Mission(candidature_id=c.id, titre=o.titre.replace("Mission ", "").capitalize(),
                         description=o.description, date_debut=date.today() - timedelta(days=30),
                         date_fin=date.today() + timedelta(days=60), avancement=av, statut=st)
            db.add(ms); db.flush()
            for pos, (t, off) in enumerate([("Cadrage et spécifications", -20), ("Livrable intermédiaire", 10), ("Recette et livraison finale", 55)]):
                db.add(Jalon(mission_id=ms.id, titre=t, date_prevue=date.today() + timedelta(days=off),
                             fait=(av >= [20, 60, 100][pos]), position=pos))
            db.add(Note(mission_id=ms.id, contenu="Démarrage effectué, cadrage validé avec le client.", avancement=min(av, 20)))
            db.add(Note(mission_id=ms.id, contenu="Point d'étape : avancement conforme au planning." if st != "en_pause"
                        else "Mission mise en pause en attente de validation du client.", avancement=av))
            created["miss"] += 1
            m += 1
    ci += 3

db.commit()
print("TERMINE :", created)