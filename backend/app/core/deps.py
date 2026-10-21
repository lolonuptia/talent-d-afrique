from fastapi import Cookie, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.revocation import est_revoque, session_invalidee
from app.core.security import decode_token
from app.models.user import User


def _extract_token(
    access_token: str | None,
    authorization: str | None,
) -> str | None:
    if access_token is not None:
        return access_token

    if authorization is not None and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1]

    return None


def get_current_user(
    access_token: str | None = Cookie(default=None),
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    token = _extract_token(access_token, authorization)

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Non authentifie.",
        )

    payload = decode_token(token)

    if payload is None or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expire.",
        )

    user = db.query(User).filter(User.id == payload.get("sub")).first()

    if user is None or not user.is_active or user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable ou compte desactive.",
        )

    if est_revoque(db, payload) or session_invalidee(user, payload):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expiree. Reconnectez-vous.",
        )

    return user


def verifier_email(user: User) -> None:
    """Une entreprise doit avoir confirme son email avant de publier ou chercher des talents."""
    if (
        settings.require_email_verification
        and user.type_profil == "entreprise"
        and user.email_verifie_at is None
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Confirmez votre adresse email (lien envoye a l'inscription) "
                "pour utiliser cette fonction."
            ),
        )


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reserve aux administrateurs.",
        )
    return current_user
