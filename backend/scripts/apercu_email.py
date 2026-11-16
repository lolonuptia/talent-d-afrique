"""Apercu et test d'envoi des emails TIBA.
python -m scripts.apercu_email                -> ecrit les apercus HTML dans le dossier temporaire
python -m scripts.apercu_email moi@mail.com   -> envoie aussi les 2 mails de test via Resend
"""

import os
import sys
import tempfile

import resend

from app.core.config import settings
from app.services.email_template import (
    alerte,
    bloc_code,
    bouton,
    habiller_email,
    html_vers_texte,
    titre,
)


def corps_code() -> str:
    return (
        titre("Bonjour Aminata", "Confirmez votre adresse email")
        + "<p style='margin:0'>Saisissez ce code dans l'application pour activer votre compte :</p>"
        + bloc_code("482916")
        + "<p style='margin:0;text-align:center'>Code valable <strong>10 minutes</strong>.</p>"
        + alerte("<strong>Ne partagez jamais ce code.</strong> L'équipe TIBA ne vous le demandera jamais.")
        + "<p style='color:#5B6B63;font-size:13px;margin:0'>Si vous n'avez pas créé de compte, ignorez ce message.</p>"
    )


def corps_lien() -> str:
    return (
        titre("Bienvenue Entreprise Test", "Plus qu'une étape pour activer votre compte")
        + "<p style='margin:0'>Confirmez votre adresse email en cliquant sur le bouton ci-dessous :</p>"
        + bouton("https://tiba.help/verify-email?token=exemple", "Confirmer mon adresse email")
        + "<p style='color:#5B6B63;font-size:13px;margin:0'>Lien valable 24 heures. "
        "Si vous n'avez pas créé de compte, ignorez ce message.</p>"
    )


def main() -> None:
    mails = [
        ("Votre code de confirmation TIBA", corps_code(), "tiba_apercu_code.html"),
        ("Confirmez votre adresse email", corps_lien(), "tiba_apercu_lien.html"),
    ]
    dest = sys.argv[1] if len(sys.argv) > 1 else None
    if dest:
        resend.api_key = settings.resend_api_key
    for sujet, corps, nom in mails:
        html = habiller_email(corps, sujet)
        chemin = os.path.join(tempfile.gettempdir(), nom)
        with open(chemin, "w", encoding="utf-8") as f:
            f.write(html)
        print("Apercu :", chemin)
        if dest:
            r = resend.Emails.send(
                {
                    "from": settings.mail_from,
                    "to": [dest],
                    "subject": "[TEST] " + sujet,
                    "html": html,
                    "text": html_vers_texte(corps),
                }
            )
            print("Envoye :", r)


if __name__ == "__main__":
    main()