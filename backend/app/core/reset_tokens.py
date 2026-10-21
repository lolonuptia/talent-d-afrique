"""Jetons de reinitialisation : valables 1 h, invalides des que le mot de passe change."""

import hashlib
from datetime import UTC, datetime, timedelta

from jose import jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_token
from app.models.user import User

DUREE_MINUTES = 60


def _empreinte(user: User) -> str:
    return hashlib.sha256(user.mot_de_passe_hash.encode("utf-8")).hexdigest()[:16]


def creer_token_reset(user: User) -> str:
    payload = {
        "sub": str(user.id),
        "type": "reset",
        "fp": _empreinte(user),
        "exp": datetime.now(UTC) + timedelta(minutes=DUREE_MINUTES),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def lire_token_reset(token: str, db: Session) -> User | None:
    data = decode_token(token)
    if not data or data.get("type") != "reset":
        return None
    user = db.query(User).filter(User.id == data.get("sub")).first()
    if user is None or not user.is_active or user.deleted_at is not None:
        return None
    if data.get("fp") != _empreinte(user):
        return None
    return user


DUREE_VERIF_HEURES = 48


def creer_token_verif(user: User) -> str:
    payload = {
        "sub": str(user.id),
        "type": "verify",
        "em": user.email.lower(),
        "exp": datetime.now(UTC) + timedelta(hours=DUREE_VERIF_HEURES),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def lire_token_verif(token: str, db: Session) -> User | None:
    data = decode_token(token)
    if not data or data.get("type") != "verify":
        return None
    user = db.query(User).filter(User.id == data.get("sub")).first()
    if user is None or not user.is_active or user.deleted_at is not None:
        return None
    if data.get("em") != user.email.lower():
        return None
    return user
