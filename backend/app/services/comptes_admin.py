"""Creation et promotion des comptes administrateur."""

from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User


def promouvoir_admin(
    db: Session,
    email: str,
    nom: str | None = None,
    mot_de_passe: str | None = None,
) -> tuple[User, bool]:
    """Promeut un compte existant, ou le cree. Renvoie (utilisateur, cree)."""
    email = email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email).first()
    cree = False
    if user is None:
        if not nom or len(nom.strip()) < 2 or not mot_de_passe:
            raise ValueError("Compte inexistant : indiquez un nom et un mot de passe.")
        if len(mot_de_passe) < 8 or len(mot_de_passe.encode("utf-8")) > 72:
            raise ValueError("Mot de passe : 8 caracteres minimum, 72 octets maximum.")
        user = User(
            nom=nom.strip(),
            email=email,
            mot_de_passe_hash=hash_password(mot_de_passe),
            type_profil="ecole",
            consent_given_at=datetime.utcnow(),
            consent_version="admin",
        )
        db.add(user)
        cree = True
    elif user.deleted_at is not None:
        raise ValueError("Ce compte a ete supprime : impossible de le promouvoir.")
    user.is_admin = True
    user.is_active = True
    if user.email_verifie_at is None:
        user.email_verifie_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user, cree
