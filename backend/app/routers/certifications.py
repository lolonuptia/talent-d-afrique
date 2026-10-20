import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.certification import Certification
from app.models.user import User
from app.schemas.certification import CertificationCreate, CertificationOut

router = APIRouter()


def _verifier_talent(current_user: User) -> None:
    if current_user.type_profil not in ("etudiant", "freelance"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reserve aux etudiants et freelances.",
        )


@router.post("", response_model=CertificationOut, status_code=status.HTTP_201_CREATED)
def add_certification(
    payload: CertificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verifier_talent(current_user)
    cert = Certification(id=uuid.uuid4(), user_id=current_user.id, **payload.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


@router.get("", response_model=list[CertificationOut])
def list_certifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verifier_talent(current_user)
    return (
        db.query(Certification)
        .filter(Certification.user_id == current_user.id)
        .order_by(Certification.date_obtention.desc().nullslast(), Certification.created_at.desc())
        .all()
    )


@router.delete("/{certification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certification(
    certification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _verifier_talent(current_user)
    cert = (
        db.query(Certification)
        .filter(Certification.id == certification_id, Certification.user_id == current_user.id)
        .first()
    )
    if cert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification introuvable.",
        )
    db.delete(cert)
    db.commit()
