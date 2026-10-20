"""A planifier une fois par jour : python -m scripts.purge_comptes (depuis le dossier backend)."""

from app.core.database import SessionLocal
from app.services.purge import purger_comptes_supprimes


def main() -> None:
    db = SessionLocal()
    try:
        n = purger_comptes_supprimes(db)
        print(f"{n} compte(s) purge(s).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
