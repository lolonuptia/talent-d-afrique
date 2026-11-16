from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.models.user import User
from app.services.code_verification import (
    DELAI_RENVOI_SECONDES,
    MAX_ESSAIS,
    code_correct,
    effacer_code,
)
from app.services.verification import envoyer_verification

router = APIRouter()


class CodeRequest(BaseModel):
    code: str = Field(pattern=r"^\d{6}$")


@router.post("/verify-code")
@limiter.limit("10/minute")
def verify_code(
    request: Request,
    payload: CodeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = current_user
    if user.email_verifie_at is not None:
        return {"message": "Email deja confirme.", "email_verifie": True}

    maintenant = datetime.utcnow()
    if not user.verif_code_hash or user.verif_code_expire_at is None or user.verif_code_expire_at < maintenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code expire. Demande un nouveau code.",
        )
    if (user.verif_code_essais or 0) >= MAX_ESSAIS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trop d'essais. Demande un nouveau code.",
        )

    if not code_correct(user, payload.code):
        user.verif_code_essais = (user.verif_code_essais or 0) + 1
        db.commit()
        restants = MAX_ESSAIS - user.verif_code_essais
        detail = (
            f"Code incorrect. Il te reste {restants} essai(s)."
            if restants > 0
            else "Trop d'essais. Demande un nouveau code."
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

    user.email_verifie_at = maintenant
    effacer_code(user)
    db.commit()
    return {"message": "Email confirme.", "email_verifie": True}


@router.post("/resend-code")
@limiter.limit("5/minute")
def resend_code(request: Request, current_user: User = Depends(get_current_user)):
    user = current_user
    if user.email_verifie_at is not None:
        return {"message": "Email deja confirme.", "email_verifie": True}

    envoye = user.verif_code_envoye_at
    if envoye is not None:
        ecoule = (datetime.utcnow() - envoye).total_seconds()
        if ecoule < DELAI_RENVOI_SECONDES:
            attente = int(DELAI_RENVOI_SECONDES - ecoule) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Patiente {attente} s avant de redemander un code.",
            )
    envoyer_verification(user)
    return {"message": "Un nouveau code vient d'etre envoye.", "email_verifie": False}