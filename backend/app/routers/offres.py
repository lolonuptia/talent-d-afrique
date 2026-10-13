import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.offre import Offre
from app.models.profiles import EntrepriseProfile, EtudiantProfile, FreelanceProfile
from app.models.user import User
from app.schemas.matching import OffreAvecScore
from app.schemas.offre import OffreCreate, OffreOut, OffreUpdate
from app.services.matching import calculer_score_matching

router = APIRouter()


def _get_entreprise_profile_or_403(current_user: User, db: Session) -> EntrepriseProfile:
    if current_user.type_profil != "entreprise":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seule une entreprise peut geren des offres.",
        )

    profile = (
        db.query(EntrepriseProfile).filter(EntrepriseProfile.user_id == current_user.id).first()
    )
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Veuillez d'abord completer votre profil entreprise.",
        )
    return profile


def _get_owned_offre_or_404(offre_id: uuid.UUID, entreprise_id: uuid.UUID, db: Session) -> Offre:
    offre = db.query(Offre).filter(Offre.id == offre_id).first()

    if offre is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre introuvable.")
    if offre.entreprise_id != entreprise_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cette offre ne vous appartient pas.",
        )
    return offre


@router.post("", response_model=OffreOut, status_code=status.HTTP_201_CREATED)
def create_offre(
    payload: OffreCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entreprise_profile = _get_entreprise_profile_or_403(current_user, db)

    offre = Offre(
        id=uuid.uuid4(),
        entreprise_id=entreprise_profile.id,
        **payload.model_dump(),
    )
    db.add(offre)
    db.commit()
    db.refresh(offre)
    return offre


@router.get("", response_model=list[OffreOut])
def list_offres(
    statut: str | None = None,
    type_contrat: str | None = None,
    db: Session = Depends(get_db),
):
    """Liste publique des offres (pour les candidats) - filtrable par statut et type de contrat."""
    query = db.query(Offre)
    if statut:
        query = query.filter(Offre.statut == statut)
    else:
        query = query.filter(Offre.statut == "active")
    if type_contrat:
        query = query.filter(Offre.type_contrat == type_contrat)
    return query.order_by(Offre.created_at.desc()).all()


@router.get("/mine", response_model=list[OffreOut])
def list_my_offres(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Historique des offres de l'entreprise connectee (actives, expirees, archivees)."""
    entreprise_profile = _get_entreprise_profile_or_403(current_user, db)
    return (
        db.query(Offre)
        .filter(Offre.entreprise_id == entreprise_profile.id)
        .order_by(Offre.created_at.desc())
        .all()
    )


@router.get("/recommandees", response_model=list[OffreAvecScore])
def list_offres_recommandees(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Offres actives triees par score de compatibilite decroissant (cf. section 2.3)."""
    candidat_tjm = None

    if current_user.type_profil == "etudiant":
        profile = (
            db.query(EtudiantProfile).filter(EtudiantProfile.user_id == current_user.id).first()
        )
        candidat_competences = profile.competences if profile else None
        candidat_disponibilite = profile.disponibilite if profile else None
        candidat_annees_experience = None
    elif current_user.type_profil == "freelance":
        profile = (
            db.query(FreelanceProfile).filter(FreelanceProfile.user_id == current_user.id).first()
        )
        candidat_competences = profile.competences if profile else None
        candidat_disponibilite = profile.disponibilite if profile else None
        candidat_annees_experience = profile.annees_experience if profile else None
        candidat_tjm = profile.tjm if profile else None
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les etudiants et freelances ont acces a des recommandations.",
        )

    offres_actives = db.query(Offre).filter(Offre.statut == "active").all()

    resultats = []
    for offre in offres_actives:
        matching = calculer_score_matching(
            candidat_competences=candidat_competences,
            candidat_disponibilite=candidat_disponibilite,
            candidat_annees_experience=candidat_annees_experience,
            candidat_tjm=candidat_tjm,
            offre_competences_obligatoires=offre.competences_obligatoires,
            offre_competences_souhaitees=offre.competences_souhaitees,
            offre_soft_skills=offre.soft_skills,
            offre_disponibilite=offre.disponibilite,
            offre_niveau_experience=offre.niveau_experience,
            offre_type_contrat=offre.type_contrat,
            offre_budget_tjm=offre.budget_tjm,
        )
        resultats.append(
            OffreAvecScore(
                **OffreOut.model_validate(offre).model_dump(),
                score_global=matching["score_global"],
                recommandee=matching["recommandee"],
                detail_score=matching["detail"],
            )
        )

    resultats.sort(key=lambda o: o.score_global, reverse=True)
    return resultats


@router.get("/{offre_id}", response_model=OffreOut)
def get_offre(offre_id: uuid.UUID, db: Session = Depends(get_db)):
    offre = db.query(Offre).filter(Offre.id == offre_id).first()
    if offre is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre introuvable.")
    return offre


@router.patch("/{offre_id}", response_model=OffreOut)
def update_offre(
    offre_id: uuid.UUID,
    payload: OffreUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entreprise_profile = _get_entreprise_profile_or_403(current_user, db)
    offre = _get_owned_offre_or_404(offre_id, entreprise_profile.id, db)

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(offre, key, value)

    db.commit()
    db.refresh(offre)
    return offre


@router.delete("/{offre_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_offre(
    offre_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entreprise_profile = _get_entreprise_profile_or_403(current_user, db)
    offre = _get_owned_offre_or_404(offre_id, entreprise_profile.id, db)

    db.delete(offre)
    db.commit()
