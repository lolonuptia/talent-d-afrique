"""Efface definitivement les comptes de test smoke-...@example.com (base de developpement)."""

from app.core.database import SessionLocal
from app.models.user import User
from app.services.purge import _purger_utilisateur


def main() -> None:
    db = SessionLocal()
    try:
        ids = [u.id for u in db.query(User).filter(User.email.like("smoke-%@example.com")).all()]
        for uid in ids:
            try:
                _purger_utilisateur(db, uid)
                db.commit()
            except Exception as exc:  # noqa: BLE001
                db.rollback()
                print(f"Impossible de purger {uid} : {exc}")
        print(f"{len(ids)} compte(s) de test traites.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
