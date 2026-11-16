"""Code de verification email a 6 chiffres (application mobile)."""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta

from app.core.config import settings
from app.models.user import User

DUREE_CODE_MINUTES = 10
MAX_ESSAIS = 5
DELAI_RENVOI_SECONDES = 60


def _empreinte(user: User, code: str) -> str:
    message = f"{user.id}:{code}".encode("utf-8")
    return hmac.new(settings.secret_key.encode("utf-8"), message, hashlib.sha256).hexdigest()


def generer_code(user: User) -> str:
    """Cree un nouveau code, le stocke hache sur l'utilisateur (sans commit) et le renvoie."""
    code = f"{secrets.randbelow(1_000_000):06d}"
    maintenant = datetime.utcnow()
    user.verif_code_hash = _empreinte(user, code)
    user.verif_code_expire_at = maintenant + timedelta(minutes=DUREE_CODE_MINUTES)
    user.verif_code_essais = 0
    user.verif_code_envoye_at = maintenant
    return code


def code_correct(user: User, code: str) -> bool:
    if not user.verif_code_hash:
        return False
    return hmac.compare_digest(user.verif_code_hash, _empreinte(user, code))


def effacer_code(user: User) -> None:
    user.verif_code_hash = None
    user.verif_code_expire_at = None
    user.verif_code_essais = 0