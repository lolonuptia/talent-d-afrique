"""Valide a la main l'email d'un compte : python -m scripts.verifier_email adresse@exemple.com"""

import sys
from datetime import datetime

from app.core.database import SessionLocal
from app.models.user import User


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage : python -m scripts.verifier_email adresse@exemple.com")
        return
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == sys.argv[1].strip().lower()).first()
        if user is None:
            print("Compte introuvable.")
            return
        user.email_verifie_at = datetime.utcnow()
        db.commit()
        print(f"Email de {user.email} marque comme verifie.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
