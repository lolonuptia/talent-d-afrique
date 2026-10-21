from html import escape

from app.core.config import settings
from app.core.reset_tokens import DUREE_VERIF_HEURES, creer_token_verif
from app.models.user import User
from app.services.notifications import envoyer_email_notification


def envoyer_verification(user: User) -> None:
    lien = f"{settings.frontend_url}/verify-email?token={creer_token_verif(user)}"
    if settings.environment != "production":
        print(f"[DEV] Lien de verification pour {user.email} : {lien}")
    envoyer_email_notification(
        user,
        "Confirmez votre adresse email",
        f"<p>Bonjour {escape(user.nom)},</p>"
        f'<p><a href="{lien}">Confirmer mon adresse email</a> '
        f"(lien valable {DUREE_VERIF_HEURES} heures).</p>"
        "<p>Si vous n'avez pas cree de compte, ignorez ce message.</p>",
    )
