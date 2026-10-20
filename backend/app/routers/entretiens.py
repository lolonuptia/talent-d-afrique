import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.candidature import Candidature
from app.models.entretien import Entretien
from app.models.offre import Offre
from app.models.profiles import EntrepriseProfile
from app.models.user import User
from app.schemas.entretien import (
    EntretienCreate,
    EntretienOut,
    EntretienUpdate,
    StatutEntretien,
)
from app.services.notifications import creer_notification, envoyer_email_notification

router = APIRouter()


def _naive_utc(dt: datetime) -> datetime:
    if dt.tzinfo is not None:
        return dt.astimezone(UTC).replace(tzinfo=None)
    return dt


def _verifier_futur(dt: datetime) -> None:
    if dt <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La date de l'entretien doit etre dans le futur.",
        )


def _profil_entreprise(current_user: User, db: Session) -> EntrepriseProfile:
    if current_user.type_profil != "entreprise":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seule une entreprise peut effectuer cette action.",
        )
    profil = (
        db.query(EntrepriseProfile).filter(EntrepriseProfile.user_id == current_user.id).first()
    )
    if profil is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Veuillez d'abord completer votre profil entreprise.",
        )
    return profil


def _verifier_propriete(candidature: Candidature, profil: EntrepriseProfile) -> None:
    if candidature.offre.entreprise_id != profil.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cette candidature ne concerne pas une de vos offres.",
        )


def _notifier(db: Session, candidat: User, titre: str, message: str, evenement: str) -> None:
    creer_notification(
        db,
        user_id=candidat.id,
        titre=titre,
        message=message,
        type_evenement=evenement,
    )
    envoyer_email_notification(candidat, titre, f"<p>{message}</p>")


def _quand(dt: datetime) -> str:
    return dt.strftime("%d/%m/%Y a %H:%M (UTC)")


@router.post("", response_model=EntretienOut, status_code=status.HTTP_201_CREATED)
def planifier_entretien(
    payload: EntretienCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profil = _profil_entreprise(current_user, db)

    candidature = db.query(Candidature).filter(Candidature.id == payload.candidature_id).first()
    if candidature is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidature introuvable."
        )
    _verifier_propriete(candidature, profil)

    if candidature.statut in ("refusee", "acceptee"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette candidature est deja cloturee.",
        )

    quand = _naive_utc(payload.date_heure)
    _verifier_futur(quand)

    data = payload.model_dump()
    data["date_heure"] = quand
    entretien = Entretien(id=uuid.uuid4(), **data)
    db.add(entretien)
    candidature.statut = "entretien"
    db.commit()
    db.refresh(entretien)

    _notifier(
        db,
        candidature.candidat,
        "Entretien planifie",
        f"Un entretien a ete planifie pour l'offre {candidature.offre.titre} le {_quand(quand)}.",
        "entretien_planifie",
    )
    return entretien


@router.get("", response_model=list[EntretienOut])
def list_entretiens(
    statut: StatutEntretien | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Entreprise : entretiens de ses offres. Talent : ses propres entretiens."""
    query = db.query(Entretien).join(Candidature, Candidature.id == Entretien.candidature_id)

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

    if statut:
        query = query.filter(Entretien.statut == statut)
    return query.order_by(Entretien.date_heure.asc()).all()


@router.patch("/{entretien_id}", response_model=EntretienOut)
def modifier_entretien(
    entretien_id: uuid.UUID,
    payload: EntretienUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profil = _profil_entreprise(current_user, db)

    entretien = db.query(Entretien).filter(Entretien.id == entretien_id).first()
    if entretien is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entretien introuvable.")
    candidature = entretien.candidature
    _verifier_propriete(candidature, profil)

    data = payload.model_dump(exclude_unset=True)
    # les champs obligatoires ne peuvent pas etre effaces
    data = {k: v for k, v in data.items() if v is not None or k in ("lieu_ou_lien", "message")}

    date_changee = False
    if "date_heure" in data:
        quand = _naive_utc(data["date_heure"])
        _verifier_futur(quand)
        date_changee = quand != entretien.date_heure
        data["date_heure"] = quand

    deja_annule = entretien.statut == "annule"
    for cle, valeur in data.items():
        setattr(entretien, cle, valeur)
    if entretien.statut == "annule" and not deja_annule and candidature.statut == "entretien":
        autre = (
            db.query(Entretien)
            .filter(
                Entretien.candidature_id == candidature.id,
                Entretien.id != entretien.id,
                Entretien.statut == "planifie",
            )
            .first()
        )
        if autre is None:
            candidature.statut = "en_cours"
    db.commit()
    db.refresh(entretien)

    titre_offre = candidature.offre.titre
    if entretien.statut == "annule" and not deja_annule:
        _notifier(
            db,
            candidature.candidat,
            "Entretien annule",
            f"L'entretien prevu pour l'offre {titre_offre} a ete annule.",
            "entretien_annule",
        )
    elif date_changee and entretien.statut == "planifie":
        _notifier(
            db,
            candidature.candidat,
            "Entretien modifie",
            f"L'entretien pour l'offre {titre_offre} est reporte au "
            f"{_quand(entretien.date_heure)}.",
            "entretien_modifie",
        )
    return entretien
