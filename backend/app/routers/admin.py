import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_admin
from app.models.candidature import Candidature
from app.models.offre import Offre
from app.models.profiles import EntrepriseProfile
from app.models.user import User
from app.schemas.admin import AdminLogOut, StatistiquesGlobales
from app.services.admin_logs import logger_action_admin

router = APIRouter()


@router.get("/utilisateurs", response_model=list[dict])
def list_all_users(
    type_profil: str | None = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Liste tous les comptes, filtrable par type de profil."""
    query = db.query(User)
    if type_profil:
        query = query.filter(User.type_profil == type_profil)
    users = query.order_by(User.created_at.desc()).all()

    return [
        {
            "id": str(u.id),
            "nom": u.nom,
            "email": u.email,
            "type_profil": u.type_profil,
            "is_active": u.is_active,
            "deleted_at": u.deleted_at,
            "created_at": u.created_at,
        }
        for u in users
    ]


@router.patch("/utilisateurs/{user_id}/suspendre")
def suspendre_utilisateur(
    user_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Suspend un compte (le desactive sans le supprimer)."""
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable."
        )

    user.is_active = False
    db.commit()

    logger_action_admin(
        db,
        admin_id=admin.id,
        action="suspension_compte",
        cible_type="user",
        cible_id=str(user_id),
    )
    return {"message": "Compte suspendu."}


@router.patch("/utilisateurs/{user_id}/reactiver")
def reactiver_utilisateur(
    user_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Reactive un compte suspendu."""
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable."
        )

    user.is_active = True
    db.commit()

    logger_action_admin(
        db,
        admin_id=admin.id,
        action="reactivation_compte",
        cible_type="user",
        cible_id=str(user_id),
    )
    return {"message": "Compte reactive."}


@router.delete("/offres/{offre_id}")
def supprimer_offre_moderation(
    offre_id: uuid.UUID,
    motif: str | None = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Supprime une offre suite a une moderation (contenu inapproprie, signalement...)."""
    offre = db.query(Offre).filter(Offre.id == offre_id).first()
    if offre is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre introuvable.")

    db.delete(offre)
    db.commit()

    logger_action_admin(
        db,
        admin_id=admin.id,
        action="suppression_offre",
        cible_type="offre",
        cible_id=str(offre_id),
        details=motif,
    )
    return {"message": "Offre supprimee."}


@router.get("/statistiques", response_model=StatistiquesGlobales)
def statistiques_globales(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Statistiques globales de la plateforme (cf. section 2.6)."""
    total_utilisateurs = db.query(User).count()
    total_etudiants = db.query(User).filter(User.type_profil == "etudiant").count()
    total_entreprises = db.query(User).filter(User.type_profil == "entreprise").count()
    total_ecoles = db.query(User).filter(User.type_profil == "ecole").count()
    total_freelances = db.query(User).filter(User.type_profil == "freelance").count()

    total_offres = db.query(Offre).count()
    total_offres_actives = db.query(Offre).filter(Offre.statut == "active").count()
    total_candidatures = db.query(Candidature).count()

    total_acceptees = db.query(Candidature).filter(Candidature.statut == "acceptee").count()
    taux_matching_moyen = (
        round((total_acceptees / total_candidatures) * 100, 1) if total_candidatures > 0 else 0.0
    )

    return StatistiquesGlobales(
        total_utilisateurs=total_utilisateurs,
        total_etudiants=total_etudiants,
        total_entreprises=total_entreprises,
        total_ecoles=total_ecoles,
        total_freelances=total_freelances,
        total_offres_actives=total_offres_actives,
        total_offres=total_offres,
        total_candidatures=total_candidatures,
        taux_matching_moyen=taux_matching_moyen,
    )


@router.get("/logs", response_model=list[AdminLogOut])
def list_admin_logs(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Historique des actions d'administration effectuees."""
    from app.models.admin_log import AdminLog

    return db.query(AdminLog).order_by(AdminLog.created_at.desc()).limit(100).all()


@router.get("/statistiques/detail")
def statistiques_detail(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Indicateurs detailles : inscriptions par mois, entreprises par secteur,
    candidatures par offre, taux de recrutement, offres par localisation."""
    mois = func.to_char(User.created_at, "YYYY-MM").label("mois")
    inscriptions = db.query(mois, func.count(User.id)).group_by(mois).order_by(mois).all()

    secteurs = (
        db.query(EntrepriseProfile.secteur, func.count(EntrepriseProfile.id))
        .group_by(EntrepriseProfile.secteur)
        .all()
    )

    par_offre = (
        db.query(Offre.id, Offre.titre, func.count(Candidature.id))
        .outerjoin(Candidature, Candidature.offre_id == Offre.id)
        .group_by(Offre.id, Offre.titre)
        .all()
    )

    localisations = (
        db.query(Offre.localisation, func.count(Offre.id)).group_by(Offre.localisation).all()
    )

    total = db.query(Candidature).count()
    acceptees = db.query(Candidature).filter(Candidature.statut == "acceptee").count()

    return {
        "inscriptions_par_mois": [{"mois": m, "total": n} for m, n in inscriptions],
        "entreprises_par_secteur": [
            {"secteur": s or "non renseigne", "total": n} for s, n in secteurs
        ],
        "candidatures_par_offre": [
            {"offre_id": str(i), "titre": t, "total": n} for i, t, n in par_offre
        ],
        "offres_par_localisation": [
            {"localisation": loc or "non renseignee", "total": n} for loc, n in localisations
        ],
        "taux_recrutement": round((acceptees / total) * 100, 1) if total else 0.0,
    }
