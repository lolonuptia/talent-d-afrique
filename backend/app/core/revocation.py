"""Revocation des jetons et invalidation des sessions (changement de mot de passe)."""

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.models.revoked_token import RevokedToken
from app.models.user import User


def est_revoque(db: Session, payload: dict) -> bool:
    jti = payload.get("jti")
    if not jti:
        return False
    return db.query(RevokedToken.jti).filter(RevokedToken.jti == jti).first() is not None


def session_invalidee(user: User, payload: dict) -> bool:
    """Vrai si le jeton a ete emis avant le dernier changement de mot de passe."""
    if user.mot_de_passe_modifie_at is None:
        return False
    iat = payload.get("iat")
    if iat is None:
        return True
    limite = user.mot_de_passe_modifie_at.replace(tzinfo=UTC).timestamp()
    return iat < int(limite)


def revoquer(db: Session, token: str) -> None:
    """Ajoute le jeton a la liste noire (l'appelant fait le commit)."""
    data = decode_token(token)
    if not data or not data.get("jti") or not data.get("exp"):
        return
    db.query(RevokedToken).filter(RevokedToken.expires_at < datetime.utcnow()).delete(
        synchronize_session=False
    )
    if db.query(RevokedToken.jti).filter(RevokedToken.jti == data["jti"]).first() is None:
        expire = datetime.fromtimestamp(data["exp"], UTC).replace(tzinfo=None)
        db.add(RevokedToken(jti=data["jti"], expires_at=expire))
        db.flush()
