"""Purge definitive des comptes supprimes (RGPD : 30 jours apres la suppression logique)."""

import logging
import uuid
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.candidature import Candidature
from app.models.certification import Certification
from app.models.entretien import Entretien
from app.models.favori import Favori
from app.models.message import Message
from app.models.notification import Notification
from app.models.offre import Offre
from app.models.portfolio import PortfolioItem
from app.models.profiles import (
    EcoleProfile,
    EntrepriseProfile,
    EtudiantProfile,
    FreelanceProfile,
)
from app.models.user import User

logger = logging.getLogger(__name__)


def _ids(requete) -> list[uuid.UUID]:
    return [ligne[0] for ligne in requete.all()]


def _purger_utilisateur(db: Session, uid: uuid.UUID) -> None:
    """Supprime toutes les donnees d'un utilisateur, dans l'ordre des cles etrangeres."""
    ids_cand = _ids(db.query(Candidature.id).filter(Candidature.candidat_id == uid))
    ids_offres: list[uuid.UUID] = []

    profil_ent = db.query(EntrepriseProfile).filter(EntrepriseProfile.user_id == uid).first()
    if profil_ent is not None:
        ids_offres = _ids(db.query(Offre.id).filter(Offre.entreprise_id == profil_ent.id))
        if ids_offres:
            ids_cand += _ids(db.query(Candidature.id).filter(Candidature.offre_id.in_(ids_offres)))

    if ids_cand:
        db.query(Message).filter(Message.candidature_id.in_(ids_cand)).delete(
            synchronize_session=False
        )
        db.query(Entretien).filter(Entretien.candidature_id.in_(ids_cand)).delete(
            synchronize_session=False
        )
        db.query(Candidature).filter(Candidature.id.in_(ids_cand)).delete(synchronize_session=False)

    filtre_favoris = Favori.user_id == uid
    if ids_offres:
        filtre_favoris = or_(filtre_favoris, Favori.offre_id.in_(ids_offres))
    db.query(Favori).filter(filtre_favoris).delete(synchronize_session=False)

    if ids_offres:
        db.query(Offre).filter(Offre.id.in_(ids_offres)).delete(synchronize_session=False)

    db.query(Message).filter(Message.expediteur_id == uid).delete(synchronize_session=False)
    db.query(Notification).filter(Notification.user_id == uid).delete(synchronize_session=False)
    db.query(Certification).filter(Certification.user_id == uid).delete(synchronize_session=False)
    db.query(PortfolioItem).filter(PortfolioItem.user_id == uid).delete(synchronize_session=False)

    ecole = db.query(EcoleProfile).filter(EcoleProfile.user_id == uid).first()
    if ecole is not None:
        db.query(EtudiantProfile).filter(EtudiantProfile.ecole_id == ecole.id).update(
            {EtudiantProfile.ecole_id: None}, synchronize_session=False
        )

    for modele in (EntrepriseProfile, EtudiantProfile, EcoleProfile, FreelanceProfile):
        db.query(modele).filter(modele.user_id == uid).delete(synchronize_session=False)

    db.query(User).filter(User.id == uid).delete(synchronize_session=False)


def purger_comptes_supprimes(
    db: Session, jours: int = 30, maintenant: datetime | None = None
) -> int:
    """Purge les comptes supprimes depuis plus de `jours` jours. Renvoie le nombre purge."""
    limite = (maintenant or datetime.utcnow()) - timedelta(days=jours)
    ids_comptes = _ids(
        db.query(User.id).filter(User.deleted_at.isnot(None), User.deleted_at <= limite)
    )

    purges = 0
    for uid in ids_comptes:
        try:
            _purger_utilisateur(db, uid)
            db.commit()
        except Exception:  # noqa: BLE001
            db.rollback()
            logger.exception("Purge impossible pour le compte %s", uid)
            continue
        (Path(settings.cv_storage_dir) / f"{uid}.pdf").unlink(missing_ok=True)
        purges += 1
    return purges
