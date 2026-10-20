import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.favori import Favori
from app.models.offre import Offre
from app.models.user import User
from app.schemas.favori import FavoriCreate, FavoriOut

router = APIRouter()


def _verifier_talent(current_user: User) -> None:
    if current_user.type_profil not in ("etudiant", "freelance"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les etudiants et freelances peuvent avoir des offres favorites.",
        )


@router.post("", response_model=FavoriOut, status_code=status.HTTP_201_CREATED)
def add_favori(
    payload: FavoriCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verifier_talent(current_user)

    offre = db.query(Offre).filter(Offre.id == payload.offre_id).first()
    if offre is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre introuvable.")

    favori = Favori(id=uuid.uuid4(), user_id=current_user.id, offre_id=payload.offre_id)
    db.add(favori)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette offre est deja dans vos favoris.",
        ) from exc

    db.refresh(favori)
    return favori


@router.get("", response_model=list[FavoriOut])
def list_favoris(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mes offres favorites, les plus recentes d'abord."""
    _verifier_talent(current_user)

    return (
        db.query(Favori)
        .filter(Favori.user_id == current_user.id)
        .order_by(Favori.created_at.desc())
        .all()
    )


@router.delete("/{offre_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favori(
    offre_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verifier_talent(current_user)

    favori = (
        db.query(Favori)
        .filter(Favori.user_id == current_user.id, Favori.offre_id == offre_id)
        .first()
    )
    if favori is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cette offre n'est pas dans vos favoris."
        )

    db.delete(favori)
    db.commit()
