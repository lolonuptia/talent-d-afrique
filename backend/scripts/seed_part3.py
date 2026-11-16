import sys, os, re, uuid, pkgutil, importlib
from datetime import datetime, timedelta, date, timezone
sys.path.insert(0, os.getcwd())

import app.models as pkg
for m in pkgutil.iter_modules(pkg.__path__):
    importlib.import_module(f"app.models.{m.name}")
from app.core.database import SessionLocal
from app.models.user import User
from app.models.profiles import EntrepriseProfile, EtudiantProfile, EcoleProfile, FreelanceProfile
from app.models.offre import Offre
from app.models.candidature import Candidature
from app.models.entretien import Entretien
from app.models.mission import Mission
from app.models.message import Message
from app.models.notification import Notification
from app.models.favori import Favori
from app.models.certification import Certification
from app.models.portfolio import PortfolioItem
from app.models.admin_log import AdminLog

def now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

db = SessionLocal()
print("Base cible :", db.get_bind().url.render_as_string(hide_password=True))
if os.environ.get("SEED_CONFIRM") != "oui":
    sys.exit("Annule.")
OVERWRITE = os.environ.get("SEED_ECRASER") == "oui"

users = (db.query(User).filter(User.email.ilike("%@example.com"), User.deleted_at.is_(None))
         .order_by(User.email).all())
by_id = {u.id: u for u in users}
etus = [u for u in users if u.type_profil == "etudiant"]
frees = [u for u in users if u.type_profil == "freelance"]
ecoles = [u for u in users if u.type_profil == "ecole"]
ents = [u for u in users if u.type_profil == "entreprise"]
print(f"{len(etus)} etudiants, {len(frees)} freelances, {len(ecoles)} ecoles, {len(ents)} entreprises")
if not etus or not frees:
    sys.exit("Il faut au moins 1 etudiant et 1 freelance, arret.")

S = dict(realign=0, cand_suppr=0, profils=0, ecoles=0, certs=0, portfolio=0,
         favoris=0, messages=0, notifs=0, logs=0)

# ---------- 0. comptes : email verifie + telephone ----------
for i, u in enumerate(users):
    if u.email_verifie_at is None:
        u.email_verifie_at = now() - timedelta(days=20)
    if not u.telephone:
        u.telephone = f"+221 77 {100 + i * 7:03d} {10 + i:02d} {20 + i:02d}"
    if u.type_profil in ("etudiant", "freelance"):
        u.telephone_partage = (i % 2 == 0)
db.flush()

# ---------- 1. coherence des candidatures ----------
offres = {o.id: o for o in db.query(Offre).all()}

def del_candidature(c):
    for en in db.query(Entretien).filter_by(candidature_id=c.id).all():
        db.delete(en)
    for ms in db.query(Mission).filter_by(candidature_id=c.id).all():
        db.delete(ms)
    db.query(Message).filter_by(candidature_id=c.id).delete(synchronize_session=False)
    db.delete(c)
    db.flush()

pool = {"freelance": frees, "etudiant": etus}
rot = 0
for c in db.query(Candidature).all():
    cu, o = by_id.get(c.candidat_id), offres.get(c.offre_id)
    if cu is None or o is None:
        continue
    want = "freelance" if o.type_contrat == "mission" else "etudiant"
    if cu.type_profil == want:
        continue
    taken = {x.candidat_id for x in db.query(Candidature).filter_by(offre_id=o.id).all()}
    repl = None
    lst = pool[want]
    for k in range(len(lst)):
        cand = lst[(rot + k) % len(lst)]
        if cand.id not in taken:
            repl = cand
            break
    rot += 1
    if repl:
        c.candidat_id = repl.id
        db.flush()
        S["realign"] += 1
    else:
        del_candidature(c)
        S["cand_suppr"] += 1

# ---------- helpers ----------
def tokens(s):
    return [t.strip() for t in re.split(r"[,;]", s or "") if t.strip()]

def uniq(seq):
    seen, out = set(), []
    for t in seq:
        if t.lower() not in seen:
            seen.add(t.lower()); out.append(t)
    return out

def domain(skills):
    s = " ".join(skills).lower()
    if any(k in s for k in ("financ", "compta", "syscohada", "sage")): return "finance"
    if any(k in s for k in ("stock", "logist", "supply", "erp", "audit")): return "logistique"
    if any(k in s for k in ("python", "fastapi", "react", "kotlin", "android", "sql", "figma", "webhooks")): return "tech"
    return "gestion"

def setv(p, attr, val):
    if val is None:
        return
    if OVERWRITE or getattr(p, attr) in (None, "", False):
        setattr(p, attr, val)

def get_or_new(model, uid):
    p = db.query(model).filter(model.user_id == uid).first()
    if p is None:
        p = model(id=uuid.uuid4(), user_id=uid)
        db.add(p); db.flush()
        S["profils"] += 1
    return p

FALLBACK = [["Communication", "Excel", "Gestion de projet"], ["Anglais professionnel", "Word", "Organisation"],
            ["Réseaux sociaux", "Canva", "Rédaction"], ["Comptabilité", "Excel", "Analyse"]]
FORM = {
 "tech": ["Licence 3 Informatique - UCAD (2025)", "Master 1 Génie logiciel - ESP Dakar (2025)", "Licence Pro Développement web - ISI Dakar (2024)"],
 "logistique": ["Licence Transport et Logistique - ESP Dakar (2025)", "Master 1 Supply Chain - ISM Dakar (2025)", "BTS Logistique - Dakar (2024)"],
 "finance": ["Licence 3 Finance-Comptabilité - UCAD (2025)", "Master 1 Finance d'entreprise - CESAG (2025)", "Licence Gestion - ISM Dakar (2024)"],
 "gestion": ["Licence 3 Gestion des entreprises - UCAD (2025)", "Master 1 Marketing digital - ISM Dakar (2025)", "Licence Pro Ressources humaines - CESAG (2024)"]}
EXP = {
 "tech": ["Stage 3 mois - développeur web, startup dakaroise (2025)", "Projet de fin d'études : application mobile de suivi de stocks"],
 "logistique": ["Stage 3 mois - assistant logistique, entreprise de transport (2025)", "Projet : optimisation des tournées de livraison"],
 "finance": ["Stage 3 mois - assistant comptable, cabinet à Dakar (2025)", "Projet : tableau de bord de trésorerie"],
 "gestion": ["Stage 2 mois - assistant administratif (2025)", "Projet : campagne de communication pour une association étudiante"]}
CERT = {
 "tech": [("Python Institute PCAP", "Python Institute"), ("Meta Front-End Developer", "Coursera")],
 "logistique": [("Supply Chain Foundations", "Coursera"), ("Lean Six Sigma Yellow Belt", "CSSC")],
 "finance": [("Fundamentals of Finance", "Coursera"), ("Excel Expert", "Microsoft")],
 "gestion": [("Google Digital Marketing", "Google"), ("Gestion de projet - bases", "OpenClassrooms")]}
PORT = {
 "tech": [("API de gestion de stocks", "Backend FastAPI + PostgreSQL, authentification JWT"), ("Application mobile de covoiturage", "Kotlin / Jetpack Compose")],
 "logistique": [("Audit d'un entrepôt à Thiès", "Cartographie des flux et plan d'actions"), ("Tableau de bord des expéditions", "Suivi des délais sous Power BI")],
 "finance": [("Modèle de budget prévisionnel", "Classeur Excel automatisé"), ("Dashboard financier", "Power BI / SQL")],
 "gestion": [("Refonte d'identité visuelle", "Charte graphique complète"), ("Plan de communication", "Calendrier éditorial sur 3 mois")]}
DISPOS = ["immediate", "1_mois", "3_mois", "6_mois"]

def applied_offers(u):
    return [offres[c.offre_id] for c in db.query(Candidature).filter_by(candidat_id=u.id).all() if c.offre_id in offres]

def build_skills(applied, idx, level):
    core = []
    for o in applied:
        for j, t in enumerate(tokens(o.competences_obligatoires)):
            if (idx + j) % 4 != 3: core.append(t)
        for j, t in enumerate(tokens(o.competences_souhaitees)):
            if (idx + j) % 2 == 0: core.append(t)
    if not core:
        core = FALLBACK[idx % len(FALLBACK)]
    return uniq(core)[:[8, 6, 4, 2][level]]

# ---------- 2. ecoles ----------
ecole_profiles = []
for i, u in enumerate(ecoles):
    p = get_or_new(EcoleProfile, u.id)
    setv(p, "nom_etablissement", u.nom)
    setv(p, "description", "Établissement d'enseignement supérieur partenaire de Talent Afrique.")
    setv(p, "localisation", "Dakar")
    ecole_profiles.append(p)
db.flush()

# ---------- 3. entreprises ----------
TAILLES = ["11-50", "50+", "1-10"]
for i, u in enumerate(ents):
    p = get_or_new(EntrepriseProfile, u.id)
    n = u.nom.lower()
    sect = ("Technologie / Logiciel" if "baobab" in n else "Transport et logistique" if "teranga" in n
            else "Fintech" if "afripay" in n else "Services aux entreprises")
    setv(p, "secteur", sect)
    setv(p, "taille", TAILLES[i % 3])
    setv(p, "localisation", "Dakar")
    setv(p, "description", f"{u.nom} recrute des talents africains pour accompagner sa croissance.")
    setv(p, "culture", "Esprit d'équipe, autonomie, montée en compétences et transparence.")

# ---------- 4. profils etudiants / freelances ----------
for idx, u in enumerate(etus):
    level = idx % 4
    applied = applied_offers(u)
    sk = build_skills(applied, idx, level)
    dom = domain(sk)
    if idx == len(etus) - 1 and not OVERWRITE and not db.query(EtudiantProfile).filter_by(user_id=u.id).first():
        continue  # un etudiant sans profil : teste l'etat "profil a completer"
    p = get_or_new(EtudiantProfile, u.id)
    setv(p, "competences", ", ".join(sk))
    if level <= 2:
        setv(p, "disponibilite", DISPOS[idx % 4])
    if level <= 1:
        setv(p, "formations", "\n".join(FORM[dom][:2 if level == 0 else 1]))
        setv(p, "visible_aux_entreprises", True)
    if level == 0:
        setv(p, "experiences", "\n".join(EXP[dom]))
        setv(p, "preferences", "Stage ou CDI à Dakar, secteur " + dom + ".")
    if ecole_profiles and idx != len(etus) - 1 and p.ecole_id is None:
        p.ecole_id = ecole_profiles[idx % len(ecole_profiles)].id
        S["ecoles"] += 1
    # certifications / portfolio
    nb_cert = [2, 1, 0, 0][level]
    for intitule, org in CERT[dom][:nb_cert]:
        if not db.query(Certification).filter_by(user_id=u.id, intitule=intitule).first():
            db.add(Certification(user_id=u.id, intitule=intitule, organisme=org,
                                 date_obtention=date(2024 + idx % 2, 1 + (idx * 3) % 12, 15),
                                 url_verification=f"https://example.com/verif/{u.id}"))
            S["certs"] += 1
    if level == 0:
        t, d = PORT[dom][0]
        if not db.query(PortfolioItem).filter_by(user_id=u.id, titre=t).first():
            db.add(PortfolioItem(user_id=u.id, titre=t, description=d, url="https://example.com/projets/" + str(idx)))
            S["portfolio"] += 1

for idx, u in enumerate(frees):
    level = idx % 4
    applied = applied_offers(u)
    sk = build_skills(applied, idx + 1, level)
    dom = domain(sk)
    p = get_or_new(FreelanceProfile, u.id)
    setv(p, "competences", ", ".join(sk))
    setv(p, "disponibilite", DISPOS[idx % 4])
    if level <= 2:
        setv(p, "tjm", float(60000 + (idx * 10000) % 50000))
        setv(p, "annees_experience", 2 + (idx * 3) % 9)
        setv(p, "visible_aux_entreprises", True)
    if level <= 1:
        setv(p, "portfolio_url", f"https://example.com/portfolio/{idx}")
    if level <= 2:
        for t, d in PORT[dom][:2 if level <= 1 else 1]:
            if not db.query(PortfolioItem).filter_by(user_id=u.id, titre=t).first():
                db.add(PortfolioItem(user_id=u.id, titre=t, description=d, url="https://example.com/projets/f" + str(idx)))
                S["portfolio"] += 1
    for intitule, org in CERT[dom][:[2, 1, 1, 0][level]]:
        if not db.query(Certification).filter_by(user_id=u.id, intitule=intitule).first():
            db.add(Certification(user_id=u.id, intitule=intitule, organisme=org,
                                 date_obtention=date(2023 + idx % 3, 1 + (idx * 5) % 12, 10),
                                 url_verification=f"https://example.com/verif/{u.id}"))
            S["certs"] += 1
db.flush()

# ---------- 5. favoris ----------
actives = [o for o in offres.values() if o.statut == "active"]
for idx, u in enumerate(etus + frees):
    mission = u.type_profil == "freelance"
    pris = {o.id for o in applied_offers(u)}
    opts = [o for o in actives if (o.type_contrat == "mission") == mission and o.id not in pris]
    for k in range(min(3, len(opts))):
        o = opts[(idx + k) % len(opts)]
        if not db.query(Favori).filter_by(user_id=u.id, offre_id=o.id).first():
            db.add(Favori(user_id=u.id, offre_id=o.id, created_at=now() - timedelta(days=k + 1)))
            S["favoris"] += 1
db.flush()

# ---------- 6. messages ----------
prof_user = {p.id: p.user_id for p in db.query(EntrepriseProfile).all()}
SCRIPT = {
 "en_cours": [("c", "Bonjour, je me permets de vous relancer concernant ma candidature."),
              ("e", "Bonjour, nous étudions votre dossier et revenons vers vous rapidement.")],
 "entretien": [("e", "Bonjour, votre profil nous intéresse. Nous souhaitons vous rencontrer."),
               ("c", "Avec plaisir, je suis disponible aux dates proposées."),
               ("e", "Parfait, l'invitation vous a été envoyée.")],
 "acceptee": [("e", "Félicitations, nous avons le plaisir de retenir votre candidature."),
              ("c", "Merci beaucoup, je suis ravi(e) de rejoindre l'équipe !"),
              ("e", "Nous vous contacterons pour les modalités de démarrage.")]}
cands = db.query(Candidature).all()
for ci, c in enumerate(cands):
    o = offres.get(c.offre_id)
    if c.statut not in SCRIPT or o is None or c.candidat_id not in by_id:
        continue
    eu = prof_user.get(o.entreprise_id)
    if eu is None or db.query(Message).filter_by(candidature_id=c.id).first():
        continue
    msgs = SCRIPT[c.statut]
    for k, (who, txt) in enumerate(msgs):
        last = (k == len(msgs) - 1)
        db.add(Message(candidature_id=c.id, expediteur_id=(eu if who == "e" else c.candidat_id),
                       contenu=txt, lue=not (last and ci % 2 == 0),
                       created_at=now() - timedelta(days=3, hours=-3 * k)))
        S["messages"] += 1
db.flush()

# ---------- 7. notifications (regenerees pour les comptes seed) ----------
uids = [u.id for u in users]
db.query(Notification).filter(Notification.user_id.in_(uids),
        Notification.type_evenement.in_(["statut_change", "candidature_recue"])).delete(synchronize_session=False)
for ci, c in enumerate(cands):
    o = offres.get(c.offre_id)
    if o is None or c.candidat_id not in by_id:
        continue
    db.add(Notification(user_id=c.candidat_id, titre="Mise à jour de votre candidature",
                        message=f"Votre candidature « {o.titre} » est : {c.statut}.",
                        type_evenement="statut_change", lue=(ci % 3 != 0),
                        created_at=c.updated_at or now()))
    S["notifs"] += 1
    eu = prof_user.get(o.entreprise_id)
    if eu:
        db.add(Notification(user_id=eu, titre="Nouvelle candidature",
                            message=f"Nouvelle candidature pour « {o.titre} ».",
                            type_evenement="candidature_recue", lue=(c.statut != "recue"),
                            created_at=c.created_at or now()))
        S["notifs"] += 1

# ---------- 8. journal admin ----------
admin = db.query(User).filter(User.is_admin.is_(True)).first()
if admin and not db.query(AdminLog).filter(AdminLog.details.like("[seed]%")).first():
    for o in [x for x in offres.values() if x.statut == "archivee"][:4]:
        db.add(AdminLog(admin_id=admin.id, action="archivage_offre", cible_type="offre",
                        cible_id=str(o.id), details=f"[seed] Offre « {o.titre} » archivée."))
        S["logs"] += 1

db.commit()
print("TERMINE :", S)

# ---------- verification ----------
bad = 0
for c in db.query(Candidature).all():
    cu, o = by_id.get(c.candidat_id), offres.get(c.offre_id)
    if cu and o and cu.type_profil != ("freelance" if o.type_contrat == "mission" else "etudiant"):
        bad += 1
print("Candidatures incoherentes (type de compte / type d'offre) :", bad)
from collections import Counter
print("Candidatures par statut :", dict(Counter(c.statut for c in db.query(Candidature).all())))
print("Missions par statut :", dict(Counter(m.statut for m in db.query(Mission).all())))
print("Entretiens par statut :", dict(Counter(e.statut for e in db.query(Entretien).all())))