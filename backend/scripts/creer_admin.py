"""Cree ou promeut un administrateur : python -m scripts.creer_admin adresse@exemple.com"""

import getpass
import sys

from app.core.database import SessionLocal
from app.models.user import User
from app.services.comptes_admin import promouvoir_admin


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage : python -m scripts.creer_admin adresse@exemple.com")
        return
    email = sys.argv[1].strip().lower()
    db = SessionLocal()
    try:
        existe = db.query(User).filter(User.email == email).first() is not None
        nom = mdp = None
        if not existe:
            nom = input("Nom du nouvel administrateur : ")
            mdp = getpass.getpass("Mot de passe (8 caracteres minimum) : ")
        try:
            user, cree = promouvoir_admin(db, email, nom, mdp)
        except ValueError as exc:
            print(f"Erreur : {exc}")
            return
        print(f"{user.email} : {'compte cree et ' if cree else ''}promu administrateur.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
