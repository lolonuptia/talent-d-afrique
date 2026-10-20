"""Expiration automatique des offres : une offre active sans modification depuis N jours expire."""

from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.offre import Offre

DUREE_VIE_JOURS = 60


def expirer_offres_perimees(db: Session, maintenant: datetime | None = None) -> int:
    """Passe en 'expiree' les offres actives trop anciennes. Reactiver une offre la renouvelle."""
    limite = (maintenant or datetime.utcnow()) - timedelta(days=DUREE_VIE_JOURS)
    derniere_maj = func.coalesce(Offre.updated_at, Offre.created_at)
    n = (
        db.query(Offre)
        .filter(Offre.statut == "active", derniere_maj < limite)
        .update(
            {Offre.statut: "expiree", Offre.updated_at: Offre.updated_at},
            synchronize_session=False,
        )
    )
    if n:
        db.commit()
    return n
