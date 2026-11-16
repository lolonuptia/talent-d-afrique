import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_admin
from app.models.user import User
from app.services.admin_logs import logger_action_admin
from app.services.notifications import creer_notification, envoyer_email_notification

router = APIRouter()


def _entreprise(db: Session, user_id: uuid.UUID) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable.")
    if user.type_profil != "entreprise":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ce compte n'est pas une entreprise.")
    return user


@router.patch("/entreprises/{user_id}/valider")
def valider_entreprise(
    user_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = _entreprise(db, user_id)
    user.statut_validation = "validee"
    db.commit()
    logger_action_admin(
        db, admin_id=admin.id, action="validation_entreprise", cible_type="user", cible_id=str(user_id)
    )
    creer_notification(
        db,
        user_id=user.id,
        titre="Compte valide",
        message="Votre compte entreprise est valide : vous pouvez publier des offres.",
        type_evenement="compte_valide",
    )
    envoyer_email_notification(
        user,
        "Votre compte entreprise est valide",
        "<p>Bonne nouvelle : votre compte TIBA a ete valide par notre equipe.</p>"
        f'<p><a href="{settings.frontend_url}/login">Se connecter</a></p>',
    )
    return {"message": "Entreprise validee."}


@router.patch("/entreprises/{user_id}/refuser")
def refuser_entreprise(
    user_id: uuid.UUID,
    motif: str | None = Query(default=None, max_length=500),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = _entreprise(db, user_id)
    user.statut_validation = "refusee"
    db.commit()
    logger_action_admin(
        db,
        admin_id=admin.id,
        action="refus_entreprise",
        cible_type="user",
        cible_id=str(user_id),
        details=motif or None,
    )
    creer_notification(
        db,
        user_id=user.id,
        titre="Compte non valide",
        message="Votre demande d'adhesion n'a pas ete retenue.",
        type_evenement="compte_refuse",
    )
    suite = f"<p>Motif : {motif}</p>" if motif else ""
    envoyer_email_notification(
        user,
        "Votre demande d'adhesion TIBA",
        "<p>Apres examen, votre demande d'adhesion n'a pas ete retenue.</p>"
        f"{suite}<p>Pour toute question, contactez l'administration de TIBA.</p>",
    )
    return {"message": "Entreprise refusee."}