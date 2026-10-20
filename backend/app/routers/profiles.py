import uuid
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.candidature import Candidature
from app.models.offre import Offre
from app.models.profiles import (
    EcoleProfile,
    EntrepriseProfile,
    EtudiantProfile,
    FreelanceProfile,
)
from app.models.user import User
from app.schemas.matching import OffreAvecScore
from app.schemas.offre import OffreOut
from app.schemas.profiles import (
    EcoleProfileIn,
    EcoleProfileOut,
    EntrepriseProfileIn,
    EntrepriseProfileOut,
    EtudiantProfileIn,
    EtudiantProfileOut,
    FreelanceProfileIn,
    FreelanceProfileOut,
)
from app.services.matching import calculer_score_matching

router = APIRouter()

PROFILE_CONFIG = {
    "entreprise": (EntrepriseProfile, EntrepriseProfileOut),
    "etudiant": (EtudiantProfile, EtudiantProfileOut),
    "ecole": (EcoleProfile, EcoleProfileOut),
    "freelance": (FreelanceProfile, FreelanceProfileOut),
}

PROFILE_IN = {
    "entreprise": EntrepriseProfileIn,
    "etudiant": EtudiantProfileIn,
    "ecole": EcoleProfileIn,
    "freelance": FreelanceProfileIn,
}


@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    model, _ = PROFILE_CONFIG[current_user.type_profil]
    profile = db.query(model).filter(model.user_id == current_user.id).first()

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun profil complete pour cet utilisateur pour le moment.",
        )
    return profile


@router.put("/me")
def upsert_my_profile(
    body: dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    model, _ = PROFILE_CONFIG[current_user.type_profil]
    profile = db.query(model).filter(model.user_id == current_user.id).first()

    try:
        data = (
            PROFILE_IN[current_user.type_profil].model_validate(body).model_dump(exclude_unset=True)
        )
    except ValidationError as exc:
        erreurs = exc.errors(include_url=False, include_context=False)
        raise HTTPException(
            status_code=422,
            detail=[
                {"loc": ["body", *e["loc"]], "msg": e["msg"].removeprefix("Value error, ")}
                for e in erreurs
            ],
        ) from exc

    if profile is None:
        profile = model(id=uuid.uuid4(), user_id=current_user.id, **data)
        db.add(profile)
    else:
        for key, value in data.items():
            setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.post("/etudiant/rattacher-ecole/{ecole_id}", response_model=EtudiantProfileOut)
def rattacher_a_une_ecole(
    ecole_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permet a un etudiant de se rattacher a une ecole existante."""
    if current_user.type_profil != "etudiant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul un etudiant peut se rattacher a une ecole.",
        )

    ecole = db.query(EcoleProfile).filter(EcoleProfile.id == ecole_id).first()
    if ecole is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ecole introuvable.")

    profile = db.query(EtudiantProfile).filter(EtudiantProfile.user_id == current_user.id).first()
    if profile is None:
        profile = EtudiantProfile(id=uuid.uuid4(), user_id=current_user.id)
        db.add(profile)

    profile.ecole_id = ecole_id
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/ecole/{ecole_id}/etudiants", response_model=list[EtudiantProfileOut])
def list_etudiants_de_ecole(
    ecole_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.type_profil != "ecole":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seule une ecole peut consulter cette liste.",
        )

    return db.query(EtudiantProfile).filter(EtudiantProfile.ecole_id == ecole_id).all()


@router.get("/ecole/{ecole_id}/suggestions", response_model=dict[str, list[OffreAvecScore]])
def suggestions_par_etudiant(
    ecole_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Pour chaque etudiant de l'ecole, liste les offres les plus adaptees (cf. section 2.4)."""
    if current_user.type_profil != "ecole":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seule une ecole peut consulter ces suggestions.",
        )

    etudiants = db.query(EtudiantProfile).filter(EtudiantProfile.ecole_id == ecole_id).all()
    offres_actives = db.query(Offre).filter(Offre.statut == "active").all()

    resultats: dict[str, list[OffreAvecScore]] = {}

    for etudiant in etudiants:
        scores_pour_etudiant = []
        for offre in offres_actives:
            matching = calculer_score_matching(
                candidat_competences=etudiant.competences,
                candidat_disponibilite=etudiant.disponibilite,
                candidat_annees_experience=None,
                candidat_tjm=None,
                offre_competences_obligatoires=offre.competences_obligatoires,
                offre_competences_souhaitees=offre.competences_souhaitees,
                offre_soft_skills=offre.soft_skills,
                offre_disponibilite=offre.disponibilite,
                offre_niveau_experience=offre.niveau_experience,
                offre_type_contrat=offre.type_contrat,
                offre_budget_tjm=offre.budget_tjm,
            )
            if matching["recommandee"]:
                scores_pour_etudiant.append(
                    OffreAvecScore(
                        **OffreOut.model_validate(offre).model_dump(),
                        score_global=matching["score_global"],
                        recommandee=matching["recommandee"],
                        detail_score=matching["detail"],
                    )
                )

        scores_pour_etudiant.sort(key=lambda o: o.score_global, reverse=True)
        resultats[str(etudiant.user_id)] = scores_pour_etudiant[:5]

    return resultats


@router.get("/ecole/{ecole_id}/statistiques")
def statistiques_ecole(
    ecole_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Statistiques simples d'employabilite de la promotion (cf. section 2.4)."""
    if current_user.type_profil != "ecole":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seule une ecole peut consulter ces statistiques.",
        )

    etudiants = db.query(EtudiantProfile).filter(EtudiantProfile.ecole_id == ecole_id).all()
    total_etudiants = len(etudiants)

    etudiant_user_ids = [e.user_id for e in etudiants]
    candidatures = (
        db.query(Candidature).filter(Candidature.candidat_id.in_(etudiant_user_ids)).all()
        if etudiant_user_ids
        else []
    )

    total_candidatures = len(candidatures)
    total_acceptees = len([c for c in candidatures if c.statut == "acceptee"])
    etudiants_places = len({c.candidat_id for c in candidatures if c.statut == "acceptee"})

    return {
        "total_etudiants": total_etudiants,
        "total_candidatures_envoyees": total_candidatures,
        "total_candidatures_acceptees": total_acceptees,
        "etudiants_places": etudiants_places,
        "taux_placement": (
            round((etudiants_places / total_etudiants) * 100, 1) if total_etudiants > 0 else 0
        ),
    }


@router.get("/ecoles")
def list_ecoles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Liste des ecoles inscrites (pour qu'un etudiant choisisse son ecole)."""
    ecoles = db.query(EcoleProfile).order_by(EcoleProfile.nom_etablissement).all()
    return [
        {
            "id": str(e.id),
            "nom_etablissement": e.nom_etablissement,
            "localisation": e.localisation,
        }
        for e in ecoles
    ]
