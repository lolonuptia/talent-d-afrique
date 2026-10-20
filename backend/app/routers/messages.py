import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.candidature import Candidature
from app.models.message import Message
from app.models.offre import Offre
from app.models.profiles import EntrepriseProfile
from app.models.user import User
from app.schemas.message import ConversationOut, MessageCreate, MessageOut
from app.services.notifications import creer_notification

router = APIRouter()


def _profil_entreprise(user: User, db: Session) -> EntrepriseProfile:
    profil = db.query(EntrepriseProfile).filter(EntrepriseProfile.user_id == user.id).first()
    if profil is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Veuillez d'abord completer votre profil entreprise.",
        )
    return profil


def _interlocuteur(candidature: Candidature, user: User, db: Session) -> User:
    """Verifie que user participe a la conversation et renvoie l'autre partie."""
    if user.type_profil == "entreprise":
        profil = _profil_entreprise(user, db)
        if candidature.offre.entreprise_id == profil.id:
            return candidature.candidat
    elif user.type_profil in ("etudiant", "freelance"):
        if candidature.candidat_id == user.id:
            return candidature.offre.entreprise.user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Vous ne participez pas a cette conversation.",
    )


def _get_candidature(candidature_id: uuid.UUID, db: Session) -> Candidature:
    candidature = db.query(Candidature).filter(Candidature.id == candidature_id).first()
    if candidature is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidature introuvable."
        )
    return candidature


@router.get("", response_model=list[ConversationOut])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mes conversations (candidatures avec au moins un message), la plus recente d'abord."""
    query = db.query(Candidature)
    if current_user.type_profil == "entreprise":
        profil = _profil_entreprise(current_user, db)
        query = query.join(Offre, Offre.id == Candidature.offre_id).filter(
            Offre.entreprise_id == profil.id
        )
    elif current_user.type_profil in ("etudiant", "freelance"):
        query = query.filter(Candidature.candidat_id == current_user.id)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reserve aux entreprises, etudiants et freelances.",
        )

    conversations: list[ConversationOut] = []
    for candidature in query.all():
        dernier = (
            db.query(Message)
            .filter(Message.candidature_id == candidature.id)
            .order_by(Message.created_at.desc())
            .first()
        )
        if dernier is None:
            continue
        non_lus = (
            db.query(func.count(Message.id))
            .filter(
                Message.candidature_id == candidature.id,
                Message.expediteur_id != current_user.id,
                Message.lue.is_(False),
            )
            .scalar()
        )
        autre = _interlocuteur(candidature, current_user, db)
        conversations.append(
            ConversationOut(
                candidature_id=candidature.id,
                offre_titre=candidature.offre.titre,
                interlocuteur_nom=autre.nom,
                dernier_message=dernier.contenu,
                dernier_message_at=dernier.created_at,
                non_lus=non_lus,
            )
        )

    conversations.sort(key=lambda c: c.dernier_message_at, reverse=True)
    return conversations


@router.get("/{candidature_id}", response_model=list[MessageOut])
def read_conversation(
    candidature_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Messages d'une conversation (ordre chronologique). Marque comme lus ceux de l'autre."""
    candidature = _get_candidature(candidature_id, db)
    _interlocuteur(candidature, current_user, db)

    db.query(Message).filter(
        Message.candidature_id == candidature_id,
        Message.expediteur_id != current_user.id,
        Message.lue.is_(False),
    ).update({Message.lue: True}, synchronize_session=False)
    db.commit()

    return (
        db.query(Message)
        .filter(Message.candidature_id == candidature_id)
        .order_by(Message.created_at.asc())
        .all()
    )


@router.post("/{candidature_id}", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    candidature_id: uuid.UUID,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidature = _get_candidature(candidature_id, db)
    destinataire = _interlocuteur(candidature, current_user, db)

    message = Message(
        id=uuid.uuid4(),
        candidature_id=candidature_id,
        expediteur_id=current_user.id,
        contenu=payload.contenu.strip(),
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    creer_notification(
        db,
        user_id=destinataire.id,
        titre="Nouveau message",
        message=f"{current_user.nom} vous a ecrit au sujet de l'offre {candidature.offre.titre}.",
        type_evenement="message_recu",
    )
    return message
