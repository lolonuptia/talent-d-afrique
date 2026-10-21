import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.candidature import Candidature
from app.models.certification import Certification
from app.models.entretien import Entretien
from app.models.message import Message
from app.models.offre import Offre
from app.models.portfolio import PortfolioItem
from app.models.profiles import EntrepriseProfile, EtudiantProfile, FreelanceProfile
from app.models.user import User
from app.schemas.candidature import (
    CandidatureCreate,
    CandidatureOut,
    CandidatureRecue,
    CandidatureStatutUpdate,
)
from app.schemas.matching import CandidatureAvecScore
from app.schemas.talent import CandidatDetailOut
from app.services.matching import calculer_score_matching
from app.services.notifications import (
    creer_notification,
    notifier_changement_statut,
    notifier_nouvelle_candidature,
)
from app.services.offres import expirer_offres_perimees

router = APIRouter()


def _get_offre_owned_by_current_entreprise(
    offre_id: uuid.UUID, current_user: User, db: Session
) -> Offre:
    if current_user.type_profil != "entreprise":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seule une entreprise peut effectuer cette action.",
        )

    entreprise_profile = (
        db.query(EntrepriseProfile).filter(EntrepriseProfile.user_id == current_user.id).first()
    )
    if entreprise_profile is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Veuillez d'abord completer votre profil entreprise.",
        )

    offre = db.query(Offre).filter(Offre.id == offre_id).first()
    if offre is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre introuvable.")
    if offre.entreprise_id != entreprise_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cette offre ne vous appartient pas.",
        )
    return offre


@router.post("", response_model=CandidatureOut, status_code=status.HTTP_201_CREATED)
def create_candidature(
    payload: CandidatureCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.type_profil not in ("etudiant", "freelance"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les etudiants et freelances peuvent postuler a une offre.",
        )

    offre = db.query(Offre).filter(Offre.id == payload.offre_id).first()
    if offre is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre introuvable.")
    expirer_offres_perimees(db)
    db.refresh(offre)
    if offre.statut != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette offre n'accepte plus de candidatures.",
        )

    candidature = Candidature(
        id=uuid.uuid4(),
        offre_id=payload.offre_id,
        candidat_id=current_user.id,
        message=payload.message,
    )
    db.add(candidature)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous avez deja postule a cette offre.",
        ) from exc

    db.refresh(candidature)

    notifier_nouvelle_candidature(db, offre.entreprise.user, offre.titre)

    return candidature


@router.get("/mine", response_model=list[CandidatureOut])
def list_my_candidatures(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Suivi des candidatures envoyees, cote candidat."""
    return (
        db.query(Candidature)
        .filter(Candidature.candidat_id == current_user.id)
        .order_by(Candidature.created_at.desc())
        .all()
    )


@router.get("/recues", response_model=list[CandidatureRecue])
def list_candidatures_recues(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dashboard entreprise : toutes les candidatures recues, toutes offres confondues."""
    if current_user.type_profil != "entreprise":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seule une entreprise peut effectuer cette action.",
        )
    profil = (
        db.query(EntrepriseProfile).filter(EntrepriseProfile.user_id == current_user.id).first()
    )
    if profil is None:
        return []
    lignes = (
        db.query(Candidature, Offre, User)
        .join(Offre, Offre.id == Candidature.offre_id)
        .join(User, User.id == Candidature.candidat_id)
        .filter(Offre.entreprise_id == profil.id, User.deleted_at.is_(None))
        .order_by(Candidature.created_at.desc())
        .all()
    )
    return [
        CandidatureRecue(
            id=c.id,
            offre_id=c.offre_id,
            candidat_id=c.candidat_id,
            message=c.message,
            statut=c.statut,
            created_at=c.created_at,
            offre_titre=o.titre,
            candidat_nom=u.nom,
        )
        for c, o, u in lignes
    ]


@router.get("/offre/{offre_id}", response_model=list[CandidatureOut])
def list_candidatures_for_offre(
    offre_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dashboard entreprise : candidatures recues pour une offre precise."""
    _get_offre_owned_by_current_entreprise(offre_id, current_user, db)

    return (
        db.query(Candidature)
        .filter(Candidature.offre_id == offre_id)
        .order_by(Candidature.created_at.desc())
        .all()
    )


@router.get("/offre/{offre_id}/classees", response_model=list[CandidatureAvecScore])
def list_candidatures_classees(
    offre_id: uuid.UUID,
    score_min: float | None = None,
    disponibilite: str | None = None,
    statut: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dashboard entreprise : candidats tries par score de compatibilite (cf. section 2.2).

    Filtres optionnels :
    - score_min : n'affiche que les candidatures dont le score global est >= a cette valeur
    - disponibilite : filtre exact sur la disponibilite declaree par le candidat
    - statut : filtre exact sur le statut (recue, en_cours, entretien, refusee, acceptee)
    """
    offre = _get_offre_owned_by_current_entreprise(offre_id, current_user, db)

    query = db.query(Candidature).filter(Candidature.offre_id == offre_id)
    if statut:
        query = query.filter(Candidature.statut == statut)
    candidatures = query.all()

    resultats = []
    for candidature in candidatures:
        candidat = candidature.candidat
        if candidat.deleted_at is not None:
            continue
        candidat_tjm = None

        if candidat.type_profil == "etudiant":
            profile = (
                db.query(EtudiantProfile).filter(EtudiantProfile.user_id == candidat.id).first()
            )
            competences = profile.competences if profile else None
            candidat_disponibilite = profile.disponibilite if profile else None
            annees_experience = None
        else:
            profile = (
                db.query(FreelanceProfile).filter(FreelanceProfile.user_id == candidat.id).first()
            )
            competences = profile.competences if profile else None
            candidat_disponibilite = profile.disponibilite if profile else None
            annees_experience = profile.annees_experience if profile else None
            candidat_tjm = profile.tjm if profile else None

        if disponibilite and (
            not candidat_disponibilite
            or candidat_disponibilite.strip().lower() != disponibilite.strip().lower()
        ):
            continue

        matching = calculer_score_matching(
            candidat_competences=competences,
            candidat_disponibilite=candidat_disponibilite,
            candidat_annees_experience=annees_experience,
            candidat_tjm=candidat_tjm,
            offre_competences_obligatoires=offre.competences_obligatoires,
            offre_competences_souhaitees=offre.competences_souhaitees,
            offre_soft_skills=offre.soft_skills,
            offre_disponibilite=offre.disponibilite,
            offre_niveau_experience=offre.niveau_experience,
            offre_type_contrat=offre.type_contrat,
            offre_budget_tjm=offre.budget_tjm,
        )

        if score_min is not None and matching["score_global"] < score_min:
            continue

        resultats.append(
            CandidatureAvecScore(
                **CandidatureOut.model_validate(candidature).model_dump(),
                score_global=matching["score_global"],
                recommandee=matching["recommandee"],
                detail_score=matching["detail"],
                candidat_nom=candidat.nom,
            )
        )

    resultats.sort(key=lambda c: c.score_global, reverse=True)
    return resultats


def _candidature_de_mon_entreprise(
    candidature_id: uuid.UUID, current_user: User, db: Session
) -> Candidature:
    candidature = db.query(Candidature).filter(Candidature.id == candidature_id).first()
    if candidature is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidature introuvable."
        )
    _get_offre_owned_by_current_entreprise(candidature.offre_id, current_user, db)
    if candidature.candidat.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidat introuvable.")
    return candidature


@router.get("/{candidature_id}/candidat", response_model=CandidatDetailOut)
def voir_profil_candidat(
    candidature_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dashboard entreprise : profil complet d'un candidat (jamais son email)."""
    candidature = _candidature_de_mon_entreprise(candidature_id, current_user, db)
    candidat = candidature.candidat
    modele = EtudiantProfile if candidat.type_profil == "etudiant" else FreelanceProfile
    profil = db.query(modele).filter(modele.user_id == candidat.id).first()

    def champ(nom: str):
        return getattr(profil, nom, None) if profil is not None else None

    certifications = (
        db.query(Certification)
        .filter(Certification.user_id == candidat.id)
        .order_by(Certification.created_at.desc())
        .all()
    )
    portfolio = (
        db.query(PortfolioItem)
        .filter(PortfolioItem.user_id == candidat.id)
        .order_by(PortfolioItem.created_at.desc())
        .all()
    )
    competences = [c.strip() for c in (champ("competences") or "").split(",") if c.strip()]
    return CandidatDetailOut(
        profile_id=profil.id if profil is not None else candidat.id,
        type_profil=candidat.type_profil,
        nom=candidat.nom,
        competences=competences,
        disponibilite=champ("disponibilite"),
        formations=champ("formations"),
        experiences=champ("experiences"),
        tjm=champ("tjm"),
        annees_experience=champ("annees_experience"),
        portfolio_url=champ("portfolio_url"),
        certifications=certifications,
        portfolio=portfolio,
        a_un_cv=(Path(settings.cv_storage_dir) / f"{candidat.id}.pdf").is_file(),
    )


@router.get("/{candidature_id}/cv")
def voir_cv_candidat(
    candidature_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dashboard entreprise : CV (PDF) du candidat, uniquement pour ses propres offres."""
    candidature = _candidature_de_mon_entreprise(candidature_id, current_user, db)
    chemin = Path(settings.cv_storage_dir) / f"{candidature.candidat_id}.pdf"
    if not chemin.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aucun CV depose.")
    return FileResponse(
        chemin,
        media_type="application/pdf",
        headers={"Content-Disposition": 'inline; filename="cv.pdf"'},
    )


@router.patch("/{candidature_id}/statut", response_model=CandidatureOut)
def update_candidature_statut(
    candidature_id: uuid.UUID,
    payload: CandidatureStatutUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidature = db.query(Candidature).filter(Candidature.id == candidature_id).first()
    if candidature is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidature introuvable."
        )

    _get_offre_owned_by_current_entreprise(candidature.offre_id, current_user, db)

    if payload.statut == candidature.statut:
        return candidature  # rien ne change : pas de notification inutile

    candidature.statut = payload.statut
    if payload.statut in ("refusee", "acceptee"):
        # une candidature cloturee n'a plus d'entretien a venir
        db.query(Entretien).filter(
            Entretien.candidature_id == candidature.id, Entretien.statut == "planifie"
        ).update({Entretien.statut: "annule"}, synchronize_session=False)
    db.commit()
    db.refresh(candidature)

    notifier_changement_statut(db, candidature.candidat, candidature.offre.titre, payload.statut)

    return candidature


@router.delete("/{candidature_id}", status_code=status.HTTP_204_NO_CONTENT)
def retirer_candidature(
    candidature_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Un candidat retire sa propre candidature (messages et entretiens lies supprimes)."""
    candidature = (
        db.query(Candidature)
        .filter(Candidature.id == candidature_id, Candidature.candidat_id == current_user.id)
        .first()
    )
    if candidature is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidature introuvable."
        )
    if candidature.statut == "acceptee":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Une candidature acceptee ne peut plus etre retiree.",
        )

    titre_offre = candidature.offre.titre
    entreprise_user_id = candidature.offre.entreprise.user_id

    db.query(Message).filter(Message.candidature_id == candidature_id).delete(
        synchronize_session=False
    )
    db.query(Entretien).filter(Entretien.candidature_id == candidature_id).delete(
        synchronize_session=False
    )
    db.delete(candidature)
    db.commit()

    creer_notification(
        db,
        user_id=entreprise_user_id,
        titre="Candidature retiree",
        message=f"{current_user.nom} a retire sa candidature pour l'offre {titre_offre}.",
        type_evenement="candidature_retiree",
    )
