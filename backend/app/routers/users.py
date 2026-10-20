from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate

router = APIRouter()


@router.patch("/me", response_model=UserOut)
def update_current_user(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.nom is not None:
        current_user.nom = payload.nom
    if payload.email is not None:
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
    # Purge definitive a implementer via une tache planifiee, 30 jours plus tard.
    current_user.deleted_at = datetime.utcnow()
    current_user.is_active = False
    db.commit()


@router.get("/me/export")
def export_current_user_data(current_user: User = Depends(get_current_user)):
    # Export RGPD basique - a enrichir au fur et a mesure que d'autres
    # tables (offres, candidatures...) seront liees a l'utilisateur.
    return {
        "id": str(current_user.id),
        "nom": current_user.nom,
        "email": current_user.email,
        "type_profil": current_user.type_profil,
        "consent_given_at": current_user.consent_given_at.isoformat(),
        "consent_version": current_user.consent_version,
        "created_at": current_user.created_at.isoformat(),
    }
