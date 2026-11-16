from html import escape

from sqlalchemy.orm import object_session

from app.core.config import settings
from app.core.reset_tokens import DUREE_VERIF_HEURES, creer_token_verif
from app.models.user import User
from app.services.code_verification import DUREE_CODE_MINUTES, generer_code
from app.services.email_template import alerte, bloc_code, bouton, titre
from app.services.notifications import envoyer_email_notification


def envoyer_verification(user: User) -> None:
    if user.type_profil == "etudiant":
        code = generer_code(user)
        db = object_session(user)
        if db is not None:
            db.commit()
        envoyer_email_notification(
            user,
            "Votre code de confirmation TIBA",
            titre(f"Bonjour {user.nom}", "Confirmez votre adresse email")
            + "<p style='margin:0'>Saisissez ce code dans l'application pour activer votre compte :</p>"
            + bloc_code(code)
            + f"<p style='margin:0;text-align:center'>Code valable <strong>{DUREE_CODE_MINUTES} minutes</strong>.</p>"
            + alerte("<strong>Ne partagez jamais ce code.</strong> L'équipe TIBA ne vous le demandera jamais.")
            + "<p style='color:#5F7090;font-size:13px;margin:0'>Si vous n'avez pas créé de compte, ignorez ce message.</p>",
        )
        return
    lien = f"{settings.frontend_url}/verify-email?token={creer_token_verif(user)}"
    envoyer_email_notification(
        user,
        "Confirmez votre adresse email",
        titre(f"Bienvenue {user.nom}", "Plus qu'une étape pour activer votre compte")
        + "<p style='margin:0'>Confirmez votre adresse email en cliquant sur le bouton ci-dessous :</p>"
        + bouton(lien, "Confirmer mon adresse email")
        + f"<p style='color:#5F7090;font-size:13px;margin:0'>Lien valable {DUREE_VERIF_HEURES} heures. "
        "Si vous n'avez pas créé de compte, ignorez ce message.</p>",
    )