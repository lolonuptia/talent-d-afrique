import re
import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.skills_dictionary import expand_skill
from app.models.certification import Certification
from app.models.portfolio import PortfolioItem
from app.models.profiles import EtudiantProfile, FreelanceProfile
from app.models.user import User
from app.schemas.profiles import DisponibiliteCandidat
from app.schemas.talent import TalentDetailOut, TalentOut

router = APIRouter()


def _split(texte: str | None) -> list[str]:
    return [c.strip() for c in (texte or "").split(",") if c.strip()]


def _filtre_competence(colonne, terme: str):
    """Vrai si la colonne contient le terme ou un de ses synonymes, en mot entier."""
    motifs = [rf"(^|[^a-z0-9]){re.escape(v)}([^a-z0-9]|$)" for v in expand_skill(terme)]
    return or_(*[colonne.op("~*")(m) for m in motifs])


def _base_query(db: Session, model):
    return (
        db.query(model, User)
        .join(User, User.id == model.user_id)
        .filter(
            model.visible_aux_entreprises.is_(True),
            User.is_active.is_(True),
            User.deleted_at.is_(None),
        )
    )


@router.get("", response_model=list[TalentOut])
def search_talents(
    competence: list[str] = Query(default=[], description="Repetable, toutes requises"),
    disponibilite: DisponibiliteCandidat | None = None,
    tjm_max: float | None = Query(default=None, ge=0, description="Freelances uniquement"),
    type_profil: Literal["etudiant", "freelance"] | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Recherche de talents visibles. Reserve aux entreprises, sans email."""
    if current_user.type_profil != "entreprise":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reserve aux entreprises.",
        )

    resultats: list[TalentOut] = []

    # Etudiants (exclus si on filtre par TJM, qu'ils n'ont pas)
    if type_profil in (None, "etudiant") and tjm_max is None:
        q = _base_query(db, EtudiantProfile)
        for c in competence:
            q = q.filter(_filtre_competence(EtudiantProfile.competences, c))
        if disponibilite:
            q = q.filter(EtudiantProfile.disponibilite == disponibilite)
        for profil, user in q.all():
            resultats.append(
                TalentOut(
                    profile_id=profil.id,
                    type_profil="etudiant",
                    nom=user.nom,
                    competences=_split(profil.competences),
                    disponibilite=profil.disponibilite,
                    formations=profil.formations,
                )
            )

    if type_profil in (None, "freelance"):
        q = _base_query(db, FreelanceProfile)
        for c in competence:
            q = q.filter(_filtre_competence(FreelanceProfile.competences, c))
        if disponibilite:
            q = q.filter(FreelanceProfile.disponibilite == disponibilite)
        if tjm_max is not None:
            q = q.filter(FreelanceProfile.tjm.isnot(None), FreelanceProfile.tjm <= tjm_max)
        for profil, user in q.all():
            resultats.append(
                TalentOut(
                    profile_id=profil.id,
                    type_profil="freelance",
                    nom=user.nom,
                    competences=_split(profil.competences),
                    disponibilite=profil.disponibilite,
                    tjm=profil.tjm,
                    annees_experience=profil.annees_experience,
                    portfolio_url=profil.portfolio_url,
                )
            )

    resultats.sort(key=lambda t: t.nom.lower())
    return resultats[offset : offset + limit]


@router.get("/{profile_id}", response_model=TalentDetailOut)
def get_talent(
    profile_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Detail d'un talent visible : profil, certifications, portfolio. Sans email."""
    if current_user.type_profil != "entreprise":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reserve aux entreprises.",
        )

    trouve = None
    for type_profil, model in (("etudiant", EtudiantProfile), ("freelance", FreelanceProfile)):
        ligne = _base_query(db, model).filter(model.id == profile_id).first()
        if ligne is not None:
            trouve = (type_profil, *ligne)
            break

    if trouve is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Talent introuvable.")

    type_profil, profil, user = trouve
    certifications = (
        db.query(Certification)
        .filter(Certification.user_id == user.id)
        .order_by(Certification.date_obtention.desc().nullslast(), Certification.created_at.desc())
        .all()
    )
    portfolio = (
        db.query(PortfolioItem)
        .filter(PortfolioItem.user_id == user.id)
        .order_by(PortfolioItem.created_at.desc())
        .all()
    )
    return TalentDetailOut(
        profile_id=profil.id,
        type_profil=type_profil,
        nom=user.nom,
        competences=_split(profil.competences),
        disponibilite=profil.disponibilite,
        formations=getattr(profil, "formations", None),
        tjm=getattr(profil, "tjm", None),
        annees_experience=getattr(profil, "annees_experience", None),
        portfolio_url=getattr(profil, "portfolio_url", None),
        certifications=certifications,
        portfolio=portfolio,
    )
