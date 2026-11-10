import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_admin
from app.models.admin_log import AdminLog
from app.models.candidature import Candidature
from app.models.favori import Favori
from app.models.offre import Offre
from app.models.profiles import EntrepriseProfile
from app.models.user import User
from app.schemas.admin import AdminLogOut, StatistiquesGlobales
from app.services.admin_logs import logger_action_admin
from app.services.notifications import creer_notification
from app.services.offres import expirer_offres_perimees

router = APIRouter()


def _like(texte: str) -> str:
    """Motif LIKE qui traite %, _ et \ comme des caracteres ordinaires."""
    echappe = texte.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{echappe}%"


def _statut_compte(u: User) -> str:
    if u.deleted_at is not None:
        return "supprime"
    return "actif" if u.is_active else "suspendu"


def _get_user(db: Session, user_id: uuid.UUID) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable."
        )
    return user


@router.get("/utilisateurs", response_model=list[dict])
def list_all_users(
    type_profil: str | None = None,
    statut: Literal["actifs", "suspendus", "supprimes"] | None = None,
    q: str | None = Query(default=None, max_length=100),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Liste des comptes : recherche (nom, email), filtres et pagination."""
    query = db.query(User)
    if type_profil:
        query = query.filter(User.type_profil == type_profil)
    if statut == "actifs":
        query = query.filter(User.is_active.is_(True), User.deleted_at.is_(None))
    elif statut == "suspendus":
        query = query.filter(User.is_active.is_not(True), User.deleted_at.is_(None))
    elif statut == "supprimes":
        query = query.filter(User.deleted_at.is_not(None))
    if q and q.strip():
        motif = _like(q.strip())
        query = query.filter(
            or_(User.nom.ilike(motif, escape="\\"), User.email.ilike(motif, escape="\\"))
        )
    users = query.order_by(User.created_at.desc(), User.id).offset(offset).limit(limit).all()

    return [
        {
            "id": str(u.id),
            "nom": u.nom,
            "email": u.email,
            "type_profil": u.type_profil,
            "is_active": u.is_active,
            "is_admin": bool(u.is_admin),
            "statut": _statut_compte(u),
            "email_verifie": u.email_verifie_at is not None,
            "deleted_at": u.deleted_at,
            "created_at": u.created_at,
        }
        for u in users
    ]


@router.patch("/utilisateurs/{user_id}/suspendre")
def suspendre_utilisateur(
    user_id: uuid.UUID,
    motif: str | None = Query(default=None, max_length=500),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Suspend un compte (le desactive sans le supprimer). Archive les offres d'une entreprise."""
    user = _get_user(db, user_id)
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas suspendre votre propre compte.",
        )
    if user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte administrateur ne peut pas etre suspendu.",
        )
    if user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce compte a ete supprime par son titulaire.",
        )

    archivees = 0
    if user.type_profil == "entreprise":
        profil = db.query(EntrepriseProfile).filter(EntrepriseProfile.user_id == user.id).first()
        if profil is not None:
            archivees = (
                db.query(Offre)
                .filter(Offre.entreprise_id == profil.id, Offre.statut == "active")
                .update({Offre.statut: "archivee"}, synchronize_session=False)
            )
    user.is_active = False
    db.commit()

    parties = [p for p in (motif, f"{archivees} offre(s) archivee(s)" if archivees else None) if p]
    logger_action_admin(
        db,
        admin_id=admin.id,
        action="suspension_compte",
        cible_type="user",
        cible_id=str(user_id),
        details=" | ".join(parties) or None,
    )
    return {"message": "Compte suspendu."}


@router.patch("/utilisateurs/{user_id}/reactiver")
def reactiver_utilisateur(
    user_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Reactive un compte suspendu (jamais un compte supprime par son titulaire)."""
    user = _get_user(db, user_id)
    if user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce compte a ete supprime par son titulaire : impossible de le reactiver.",
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


@router.patch("/utilisateurs/{user_id}/verifier-email")
def verifier_email_manuellement(
    user_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Confirme l'email d'un compte a la place de l'utilisateur."""
    from datetime import datetime

    user = _get_user(db, user_id)
    if user.email_verifie_at is None:
        user.email_verifie_at = datetime.utcnow()
        db.commit()
        logger_action_admin(
            db,
            admin_id=admin.id,
            action="verification_email_manuelle",
            cible_type="user",
            cible_id=str(user_id),
        )
    return {"message": "Email confirme."}


@router.get("/offres", response_model=list[dict])
def list_offres_moderation(
    statut: str | None = None,
    q: str | None = Query(default=None, max_length=100),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Toutes les offres (tous statuts) avec leur entreprise, pour la moderation."""
    expirer_offres_perimees(db)
    nb = (
        db.query(Candidature.offre_id.label("oid"), func.count(Candidature.id).label("n"))
        .group_by(Candidature.offre_id)
        .subquery()
    )
    query = (
        db.query(Offre, User.nom, func.coalesce(nb.c.n, 0))
        .join(EntrepriseProfile, EntrepriseProfile.id == Offre.entreprise_id)
        .join(User, User.id == EntrepriseProfile.user_id)
        .outerjoin(nb, nb.c.oid == Offre.id)
    )
    if statut:
        query = query.filter(Offre.statut == statut)
    if q and q.strip():
        motif = _like(q.strip())
        query = query.filter(
            or_(Offre.titre.ilike(motif, escape="\\"), User.nom.ilike(motif, escape="\\"))
        )
    lignes = query.order_by(Offre.created_at.desc(), Offre.id).offset(offset).limit(limit).all()
    return [
        {
            "id": str(o.id),
            "titre": o.titre,
            "statut": o.statut,
            "type_contrat": o.type_contrat,
            "localisation": o.localisation,
            "entreprise": nom,
            "candidatures": int(n),
            "created_at": o.created_at,
        }
        for o, nom, n in lignes
    ]


@router.delete("/offres/{offre_id}")
def supprimer_offre_moderation(
    offre_id: uuid.UUID,
    motif: str | None = Query(default=None, max_length=500),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retire une offre. Sans candidature : suppression. Avec : archivage (rien n'est perdu)."""
    offre = db.query(Offre).filter(Offre.id == offre_id).first()
    if offre is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre introuvable.")

    titre = offre.titre
    proprietaire_id = offre.entreprise.user_id
    a_des_candidatures = (
        db.query(Candidature.id).filter(Candidature.offre_id == offre_id).first() is not None
    )
    if a_des_candidatures:
        offre.statut = "archivee"
        action = "archivage_offre_moderation"
        message = "Offre archivee : elle a des candidatures, elles sont conservees."
    else:
        db.query(Favori).filter(Favori.offre_id == offre_id).delete(synchronize_session=False)
        db.delete(offre)
        action = "suppression_offre"
        message = "Offre supprimee."
    db.commit()

    logger_action_admin(
        db,
        admin_id=admin.id,
        action=action,
        cible_type="offre",
        cible_id=str(offre_id),
        details=motif,
    )
    texte = f"Votre offre « {titre} » a ete retiree par la moderation."
    if motif:
        texte += f" Motif : {motif}"
    creer_notification(
        db,
        user_id=proprietaire_id,
        titre="Offre retiree par la moderation",
        message=texte,
        type_evenement="offre_moderee",
    )
    return {"message": message}


@router.get("/offres/compteurs")
def compteurs_offres(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Nombre d'offres par statut, pour les tuiles de la moderation."""
    expirer_offres_perimees(db)
    res = {"active": 0, "expiree": 0, "archivee": 0}
    for statut, n in db.query(Offre.statut, func.count(Offre.id)).group_by(Offre.statut).all():
        res[str(statut)] = int(n)
    res["total"] = sum(res.values())
    return res

@router.get("/statistiques", response_model=StatistiquesGlobales)
def statistiques_globales(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Statistiques globales de la plateforme (comptes supprimes exclus)."""
    comptes = db.query(User).filter(User.deleted_at.is_(None))

    def par_type(type_profil: str) -> int:
        return comptes.filter(User.type_profil == type_profil).count()

    total_offres = db.query(Offre).count()
    total_offres_actives = db.query(Offre).filter(Offre.statut == "active").count()
    total_candidatures = db.query(Candidature).count()
    total_acceptees = db.query(Candidature).filter(Candidature.statut == "acceptee").count()
    taux_matching_moyen = (
        round((total_acceptees / total_candidatures) * 100, 1) if total_candidatures > 0 else 0.0
    )

    return StatistiquesGlobales(
        total_utilisateurs=comptes.count(),
        total_etudiants=par_type("etudiant"),
        total_entreprises=par_type("entreprise"),
        total_ecoles=par_type("ecole"),
        total_freelances=par_type("freelance"),
        total_offres_actives=total_offres_actives,
        total_offres=total_offres,
        total_candidatures=total_candidatures,
        taux_matching_moyen=taux_matching_moyen,
        comptes_suspendus=comptes.filter(User.is_active.is_not(True)).count(),
        entreprises_non_verifiees=comptes.filter(
            User.type_profil == "entreprise", User.email_verifie_at.is_(None)
        ).count(),
    )


@router.get("/logs", response_model=list[AdminLogOut])
def list_admin_logs(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Historique des actions d'administration, les plus recentes d'abord."""
    lignes = (
        db.query(AdminLog, User.nom)
        .outerjoin(User, User.id == AdminLog.admin_id)
        .order_by(AdminLog.created_at.desc(), AdminLog.id)
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [
        AdminLogOut(
            id=log.id,
            admin_id=log.admin_id,
            admin_nom=nom,
            action=log.action,
            cible_type=log.cible_type,
            cible_id=log.cible_id,
            details=log.details,
            created_at=log.created_at,
        )
        for log, nom in lignes
    ]


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
