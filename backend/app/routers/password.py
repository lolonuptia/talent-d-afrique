from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.core.reset_tokens import DUREE_MINUTES, creer_token_reset, lire_token_reset
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.services.notifications import envoyer_email_notification

router = APIRouter()

MESSAGE_ENVOI = (
    "Si un compte existe avec cet email, un lien de reinitialisation vient d'etre envoye."
)


@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(
    request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)
):
    user = db.query(User).filter(func.lower(User.email) == payload.email.lower()).first()
    if user is not None and user.is_active and user.deleted_at is None:
        lien = f"{settings.frontend_url}/reset-password?token={creer_token_reset(user)}"
        if settings.environment != "production":
            print(f"[DEV] Lien de reinitialisation pour {user.email} : {lien}")
        envoyer_email_notification(
            user,
            "Reinitialisation de votre mot de passe",
            f"<p>Bonjour {user.nom},</p>"
            f'<p><a href="{lien}">Choisir un nouveau mot de passe</a> '
            f"(lien valable {DUREE_MINUTES} minutes, utilisable une seule fois).</p>"
            "<p>Si vous n'etes pas a l'origine de cette demande, ignorez ce message.</p>",
        )
    return {"message": MESSAGE_ENVOI}


@router.post("/reset-password")
@limiter.limit("10/minute")
def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = lire_token_reset(payload.token, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lien invalide ou expire. Refaites une demande.",
        )
    user.mot_de_passe_hash = hash_password(payload.mot_de_passe)
    db.commit()
    return {"message": "Mot de passe modifie."}


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.ancien_mot_de_passe, current_user.mot_de_passe_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Mot de passe actuel incorrect."
        )
    current_user.mot_de_passe_hash = hash_password(payload.nouveau_mot_de_passe)
    db.commit()
    return {"message": "Mot de passe modifie."}
