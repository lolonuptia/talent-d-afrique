"""Expiration automatique des offres, avec avertissement 7 jours avant."""

from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.offre import Offre
from app.services.notifications import creer_notification

DUREE_VIE_JOURS = 60
AVERTISSEMENT_JOURS = 7


def _notifier_une_fois(db: Session, user_id, titre: str, message: str, evenement: str) -> None:
    """Cree la notification sauf si la meme existe deja (evite les doublons)."""
    deja = (
        db.query(Notification.id)
        .filter(
            Notification.user_id == user_id,
            Notification.type_evenement == evenement,
            Notification.message == message,
        )
        .first()
    )
    if deja is None:
        creer_notification(
            db, user_id=user_id, titre=titre, message=message, type_evenement=evenement
        )


def _derniere_maj(offre: Offre) -> datetime:
    return offre.updated_at or offre.created_at


def expirer_offres_perimees(db: Session, maintenant: datetime | None = None) -> int:
    """Expire les offres actives trop anciennes et previent l'entreprise 7 jours avant.

    Modifier, enregistrer ou reactiver une offre la renouvelle pour DUREE_VIE_JOURS jours.
    """
    maintenant = maintenant or datetime.utcnow()
    limite = maintenant - timedelta(days=DUREE_VIE_JOURS)
    seuil_alerte = maintenant - timedelta(days=DUREE_VIE_JOURS - AVERTISSEMENT_JOURS)
    maj = func.coalesce(Offre.updated_at, Offre.created_at)

    perimees = db.query(Offre).filter(Offre.statut == "active", maj < limite).all()
    expirees = [
        (o.entreprise.user_id, o.titre, _derniere_maj(o) + timedelta(days=DUREE_VIE_JOURS))
        for o in perimees
    ]
    if perimees:
        db.query(Offre).filter(Offre.id.in_([o.id for o in perimees])).update(
            {Offre.statut: "expiree", Offre.updated_at: Offre.updated_at},
            synchronize_session=False,
        )
        db.commit()
    for user_id, titre, date in expirees:
        message = (
            f"Votre offre « {titre} » a expiré le {date:%d/%m/%Y}. "
            "Vous pouvez la réactiver depuis « Mes offres »."
        )
        _notifier_une_fois(db, user_id, "Offre expirée", message, "offre_expiree")

    bientot = (
        db.query(Offre).filter(Offre.statut == "active", maj < seuil_alerte, maj >= limite).all()
    )
    for offre in bientot:
        date = _derniere_maj(offre) + timedelta(days=DUREE_VIE_JOURS)
        message = (
            f"Votre offre « {offre.titre} » expirera le {date:%d/%m/%Y}. "
            "Cliquez sur « Prolonger » dans « Mes offres » pour la garder en ligne."
        )
        _notifier_une_fois(
            db, offre.entreprise.user_id, "Offre bientôt expirée", message, "offre_bientot_expiree"
        )
    return len(perimees)
