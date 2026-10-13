from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

# Desactive automatiquement en environnement de test, pour eviter que
# les appels repetes des tests automatises se bloquent entre eux.
limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.environment != "test",
)
