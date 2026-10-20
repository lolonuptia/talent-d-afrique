import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.portfolio import PortfolioItem
from app.models.user import User
from app.schemas.portfolio import PortfolioItemCreate, PortfolioItemOut

router = APIRouter()


def _verifier_talent(current_user: User) -> None:
    if current_user.type_profil not in ("etudiant", "freelance"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reserve aux etudiants et freelances.",
        )


@router.post("", response_model=PortfolioItemOut, status_code=status.HTTP_201_CREATED)
def add_item(
    payload: PortfolioItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verifier_talent(current_user)
    item = PortfolioItem(id=uuid.uuid4(), user_id=current_user.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("", response_model=list[PortfolioItemOut])
def list_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verifier_talent(current_user)
    return (
        db.query(PortfolioItem)
        .filter(PortfolioItem.user_id == current_user.id)
        .order_by(PortfolioItem.created_at.desc())
        .all()
    )


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verifier_talent(current_user)
    item = (
        db.query(PortfolioItem)
        .filter(PortfolioItem.id == item_id, PortfolioItem.user_id == current_user.id)
        .first()
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Element introuvable.")
    db.delete(item)
    db.commit()
