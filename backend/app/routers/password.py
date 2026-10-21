from datetime import datetime
from html import escape

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.core.reset_tokens import (
    DUREE_MINUTES,
    creer_token_reset,
    lire_token_reset,
    lire_token_verif,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.user import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
)
from app.services.notifications import envoyer_email_notification
from app.services.verification import envoyer_verification

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
            f"<p>Bonjour {escape(user.nom)},</p>"
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
    maintenant = datetime.utcnow()
    user.mot_de_passe_hash = hash_password(payload.mot_de_passe)
    user.mot_de_passe_modifie_at = maintenant  # coupe toutes les anciennes sessions
    if user.email_verifie_at is None:
        user.email_verifie_at = maintenant  # le lien recu par email prouve la propriete
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
    current_user.mot_de_passe_modifie_at = datetime.utcnow()  # coupe les autres sessions
    db.commit()
    # nouveaux jetons pour que la session en cours continue
    return {
        "message": "Mot de passe modifie.",
        "access_token": create_access_token(str(current_user.id)),
        "refresh_token": create_refresh_token(str(current_user.id)),
    }


@router.post("/verify-email")
@limiter.limit("20/minute")
def verify_email(request: Request, payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = lire_token_verif(payload.token, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lien invalide ou expire. Demandez un nouveau lien depuis le dashboard.",
        )
    if user.email_verifie_at is None:
        user.email_verifie_at = datetime.utcnow()
        db.commit()
    return {"message": "Email confirme."}


@router.post("/resend-verification")
@limiter.limit("3/minute")
def resend_verification(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    if current_user.email_verifie_at is None:
        envoyer_verification(current_user)
    return {
        "message": "Si votre email n'est pas encore confirme, un nouveau lien vient d'etre envoye."
    }
