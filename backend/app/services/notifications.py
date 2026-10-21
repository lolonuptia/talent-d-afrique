import threading
import uuid
from html import escape
from types import SimpleNamespace

import resend
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.notification import Notification
from app.models.user import User

resend.api_key = settings.resend_api_key


def creer_notification(
    db: Session,
    *,
    user_id: uuid.UUID,
    titre: str,
    message: str | None = None,
    type_evenement: str,
) -> Notification:
    """Cree une notification in-app. Ne leve jamais d'exception vers l'appelant :
    une notification manquee ne doit jamais faire echouer l'action principale."""
    notification = Notification(
        id=uuid.uuid4(),
        user_id=user_id,
        titre=titre,
        message=message,
        type_evenement=type_evenement,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def _envoyer_email_sync(destinataire: User, sujet: str, contenu_html: str) -> None:
    """Envoie un email via Resend. Echoue silencieusement (log uniquement) si la
    cle API n'est pas configuree ou si Resend est indisponible - ne doit jamais
    bloquer le reste de l'application."""
    if not settings.resend_api_key:
        print(f"[EMAIL NON ENVOYE - pas de cle API] A: {destinataire.email} | Sujet: {sujet}")
        return

    try:
        resend.Emails.send(
            {
                "from": "Talent d'Afrique <notifications@talentdafrique.com>",
                "to": [destinataire.email],
                "subject": sujet,
                "html": contenu_html,
            }
        )
    except Exception as exc:  # noqa: BLE001
        print(f"[ERREUR ENVOI EMAIL] {destinataire.email} : {exc}")


def envoyer_email_notification(destinataire: User, sujet: str, contenu_html: str) -> None:
    """Envoie l'email en arriere-plan : la requete HTTP n'attend jamais le fournisseur."""
    cible = SimpleNamespace(email=destinataire.email)
    threading.Thread(
        target=_envoyer_email_sync, args=(cible, sujet, contenu_html), daemon=True
    ).start()


def notifier_nouvelle_candidature(db: Session, entreprise_user: User, offre_titre: str) -> None:
    creer_notification(
        db,
        user_id=entreprise_user.id,
        titre="Nouvelle candidature reçue",
        message=f"Vous avez reçu une nouvelle candidature pour l'offre « {offre_titre} ».",
        type_evenement="candidature_recue",
    )
    contenu = (
        f"<p>Vous avez reçu une nouvelle candidature pour l'offre "
        f"<strong>{escape(offre_titre)}</strong>.</p>"
    )
    envoyer_email_notification(
        entreprise_user,
        sujet="Nouvelle candidature reçue",
        contenu_html=contenu,
    )


def notifier_changement_statut(
    db: Session, candidat_user: User, offre_titre: str, nouveau_statut: str
) -> None:
    libelles = {
        "recue": "est de nouveau en attente d'examen",
        "en_cours": "est en cours d'examen",
        "entretien": "passe à l'étape entretien, l'entreprise vous contactera bientôt",
        "refusee": "n'a pas été retenue",
        "acceptee": "a été acceptée",
    }
    libelle = libelles.get(nouveau_statut, f"est passée au statut « {nouveau_statut} »")

    creer_notification(
        db,
        user_id=candidat_user.id,
        titre="Mise à jour de votre candidature",
        message=f"Votre candidature pour « {offre_titre} » {libelle}.",
        type_evenement="statut_change",
    )
    contenu = f"<p>Votre candidature pour <strong>{escape(offre_titre)}</strong> {libelle}.</p>"
    envoyer_email_notification(
        candidat_user,
        sujet="Mise à jour de votre candidature",
        contenu_html=contenu,
    )
