import uuid
from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import verify_password
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
from app.schemas.user import UserOut, UserUpdate

router = APIRouter()

PROFILS = {
    "entreprise": EntrepriseProfile,
    "etudiant": EtudiantProfile,
    "ecole": EcoleProfile,
    "freelance": FreelanceProfile,
}


def _ligne(obj, exclure=()) -> dict:
    """Convertit une ligne SQLAlchemy en dictionnaire serialisable en JSON."""
    resultat = {}
    for colonne in obj.__table__.columns:
        if colonne.name in exclure:
            continue
        valeur = getattr(obj, colonne.name)
        if isinstance(valeur, (datetime, date)):
            valeur = valeur.isoformat()
        elif isinstance(valeur, uuid.UUID):
            valeur = str(valeur)
        resultat[colonne.name] = valeur
    return resultat


@router.patch("/me", response_model=UserOut)
def update_current_user(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.nom is not None:
        current_user.nom = payload.nom
    if payload.email is not None:
        if (
            current_user.type_profil == "entreprise"
            and payload.email.lower() != current_user.email.lower()
        ):
            if not payload.mot_de_passe_actuel or not verify_password(
                payload.mot_de_passe_actuel, current_user.mot_de_passe_hash
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Mot de passe actuel manquant ou incorrect.",
                )
        deja = (
            db.query(User)
            .filter(func.lower(User.email) == payload.email.lower(), User.id != current_user.id)
            .first()
        )
        if deja is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cet email est deja utilise.",
            )
        current_user.email = payload.email

    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Suppression logique (soft delete) - decision RGPD section 6.1 du recap.
    # Purge definitive apres 30 jours : voir app/services/purge.py et scripts/purge_comptes.py
    current_user.deleted_at = datetime.utcnow()
    current_user.is_active = False
    if current_user.type_profil == "entreprise":
        profil_ent = (
            db.query(EntrepriseProfile).filter(EntrepriseProfile.user_id == current_user.id).first()
        )
        if profil_ent is not None:
            # les offres d'une entreprise supprimee ne doivent plus etre publiques
            db.query(Offre).filter(Offre.entreprise_id == profil_ent.id).update(
                {Offre.statut: "archivee"}, synchronize_session=False
            )
    db.commit()


@router.get("/me/export")
def export_current_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export RGPD : toutes les donnees liees au compte (jamais le hash du mot de passe)."""
    modele = PROFILS.get(current_user.type_profil)
    profil = db.query(modele).filter(modele.user_id == current_user.id).first() if modele else None

    offres = []
    if isinstance(profil, EntrepriseProfile):
        offres = db.query(Offre).filter(Offre.entreprise_id == profil.id).all()
    ids_offres = [o.id for o in offres]

    filtre_cand = Candidature.candidat_id == current_user.id
    if ids_offres:
        filtre_cand = or_(filtre_cand, Candidature.offre_id.in_(ids_offres))
    candidatures = db.query(Candidature).filter(filtre_cand).all()
    ids_cand = [c.id for c in candidatures]

    entretiens = (
        db.query(Entretien).filter(Entretien.candidature_id.in_(ids_cand)).all() if ids_cand else []
    )

    filtre_msg = Message.expediteur_id == current_user.id
    if ids_cand:
        filtre_msg = or_(filtre_msg, Message.candidature_id.in_(ids_cand))
    messages = db.query(Message).filter(filtre_msg).order_by(Message.created_at).all()

    def tout(modele_, colonne):
        return db.query(modele_).filter(colonne == current_user.id).all()

    return {
        "exporte_le": datetime.now(UTC).isoformat(),
        "compte": _ligne(current_user, exclure=("mot_de_passe_hash",)),
        "profil": _ligne(profil) if profil is not None else None,
        "offres": [_ligne(o) for o in offres],
        "candidatures": [_ligne(c) for c in candidatures],
        "entretiens": [_ligne(e) for e in entretiens],
        "messages": [_ligne(m) for m in messages],
        "notifications": [_ligne(n) for n in tout(Notification, Notification.user_id)],
        "favoris": [_ligne(f) for f in tout(Favori, Favori.user_id)],
        "certifications": [_ligne(c) for c in tout(Certification, Certification.user_id)],
        "portfolio": [_ligne(p) for p in tout(PortfolioItem, PortfolioItem.user_id)],
    }
