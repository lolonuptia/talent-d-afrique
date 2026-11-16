import sys, os, pkgutil, importlib
from datetime import datetime, timezone
sys.path.insert(0, os.getcwd())

import app.models as pkg
for m in pkgutil.iter_modules(pkg.__path__):
    importlib.import_module(f"app.models.{m.name}")
from app.core.database import SessionLocal
from app.models.user import User
import app.core.security as sec

verify = sec.verify_password
hasher = next((getattr(sec, n) for n in ("hash_password", "get_password_hash", "hash_mot_de_passe") if hasattr(sec, n)), None)

db = SessionLocal()
print("Base cible :", db.get_bind().url.render_as_string(hide_password=True))

CANDIDATS = ["Password@123", "Passeword@123"]
RESET = os.environ.get("SEED_RESET") == "oui"
NEW = "Password@123"

users = db.query(User).filter(User.email.ilike("%@example.com")).order_by(User.type_profil, User.email).all()
print(f"{len(users)} comptes @example.com\n")
ok = ko = 0
for u in users:
    match = None
    for pw in CANDIDATS:
        try:
            if verify(pw, u.mot_de_passe_hash):
                match = pw; break
        except Exception:
            pass
    etat = []
    if not u.is_active: etat.append("INACTIF")
    if u.deleted_at is not None: etat.append("SUPPRIME")
    if u.email_verifie_at is None: etat.append("email non verifie")
    print(f"{u.email:40} {u.type_profil:10} mdp={match or 'AUCUN'}  {' '.join(etat)}")
    if match: ok += 1
    else: ko += 1
    if RESET:
        if hasher is None:
            sys.exit("Fonction de hash introuvable dans app.core.security.")
        u.mot_de_passe_hash = hasher(NEW)
        u.is_active = True
        u.deleted_at = None
        if u.email_verifie_at is None:
            u.email_verifie_at = datetime.now(timezone.utc).replace(tzinfo=None)
        u.mot_de_passe_modifie_at = None
if RESET:
    db.commit()
    print(f"\nReinitialise : tous les comptes @example.com ont maintenant le mot de passe {NEW}")
else:
    print(f"\nMot de passe reconnu : {ok} comptes, aucun : {ko} comptes")