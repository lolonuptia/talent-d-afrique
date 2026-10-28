"""Admin avance : fiche, roles, deconnexion forcee, purge, annonces, exports, journal."""

import csv
import io
import uuid
from datetime import date, datetime
from html import escape
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_admin
from app.core.reset_tokens import DUREE_MINUTES, creer_token_reset
from app.core.security import verify_password
from app.models.admin_log import AdminLog
from app.models.candidature import Candidature
from app.models.notification import Notification
from app.models.offre import Offre
from app.models.profiles import EntrepriseProfile
from app.models.user import User
from app.routers.admin import _get_user, _statut_compte
from app.routers.users import PROFILS, _ligne
from app.schemas.admin import AdminLogOut
from app.schemas.user import MotDePasseSaisi
from app.services.admin_logs import logger_action_admin
from app.services.notifications import envoyer_email_notification
from app.services.purge import _purger_utilisateur

router = APIRouter()


def _verifier_mdp(admin: User, mot_de_passe: str) -> None:
    if not verify_password(mot_de_passe, admin.mot_de_passe_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Mot de passe incorrect."
        )


# ---------- fiche ----------
@router.get("/utilisateurs/{user_id}/fiche")
def fiche_utilisateur(
    user_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Vue complete d'un compte : profil, offres, compteurs, historique des actions admin."""
    user = _get_user(db, user_id)
    modele = PROFILS.get(user.type_profil)
    profil = db.query(modele).filter(modele.user_id == user.id).first() if modele else None

    offres = []
    candidatures_recues = 0
    if isinstance(profil, EntrepriseProfile):
        mes_offres = (
            db.query(Offre)
            .filter(Offre.entreprise_id == profil.id)
            .order_by(Offre.created_at.desc())
            .limit(50)
            .all()
        )
        for o in mes_offres:
            n = db.query(func.count(Candidature.id)).filter(Candidature.offre_id == o.id).scalar()
            offres.append(
                {"id": str(o.id), "titre": o.titre, "statut": o.statut, "candidatures": int(n)}
            )
        candidatures_recues = int(
            db.query(func.count(Candidature.id))
            .join(Offre, Offre.id == Candidature.offre_id)
            .filter(Offre.entreprise_id == profil.id)
            .scalar()
        )
    envoyees = db.query(func.count(Candidature.id)).filter(Candidature.candidat_id == user.id)

    lignes = (
        db.query(AdminLog, User.nom)
        .outerjoin(User, User.id == AdminLog.admin_id)
        .filter(AdminLog.cible_type == "user", AdminLog.cible_id == str(user.id))
        .order_by(AdminLog.created_at.desc())
        .limit(20)
        .all()
    )
    return {
        "compte": _ligne(user, exclure=("mot_de_passe_hash",)),
        "statut": _statut_compte(user),
        "profil": _ligne(profil, exclure=("cv_url",)) if profil is not None else None,
        "a_un_cv": (Path(settings.cv_storage_dir) / f"{user.id}.pdf").is_file(),
        "offres": offres,
        "compteurs": {
            "offres": len(offres),
            "candidatures_envoyees": int(envoyees.scalar()),
            "candidatures_recues": candidatures_recues,
        },
        "historique": [
            {
                "action": log.action,
                "details": log.details,
                "admin_nom": nom,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log, nom in lignes
        ],
    }


# ---------- roles ----------
class RoleIn(BaseModel):
    is_admin: bool
    mot_de_passe: MotDePasseSaisi


@router.patch("/utilisateurs/{user_id}/role")
def changer_role(
    user_id: uuid.UUID,
    payload: RoleIn,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Donne ou retire le role administrateur (mot de passe de l'admin exige)."""
    _verifier_mdp(admin, payload.mot_de_passe)
    user = _get_user(db, user_id)
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas modifier votre propre role.",
        )
    if bool(user.is_admin) == payload.is_admin:
        return {"message": "Aucun changement."}
    if payload.is_admin and (user.deleted_at is not None or not user.is_active):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seul un compte actif peut devenir administrateur.",
        )
    user.is_admin = payload.is_admin
    db.commit()
    logger_action_admin(
        db,
        admin_id=admin.id,
        action="promotion_admin" if payload.is_admin else "retrait_admin",
        cible_type="user",
        cible_id=str(user_id),
    )
    return {"message": "Role administrateur accorde." if payload.is_admin else "Role retire."}


# ---------- securite d'un compte ----------
@router.post("/utilisateurs/{user_id}/deconnecter")
def deconnecter_partout(
    user_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Coupe toutes les sessions ouvertes d'un utilisateur."""
    user = _get_user(db, user_id)
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pour votre propre compte, changez votre mot de passe.",
        )
    user.mot_de_passe_modifie_at = datetime.utcnow()
    db.commit()
    logger_action_admin(
        db,
        admin_id=admin.id,
        action="deconnexion_forcee",
        cible_type="user",
        cible_id=str(user_id),
    )
    return {"message": "Toutes les sessions de ce compte sont fermees."}


@router.post("/utilisateurs/{user_id}/lien-reinitialisation")
def envoyer_lien_reinitialisation(
    user_id: uuid.UUID,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Envoie a l'utilisateur un lien pour choisir un nouveau mot de passe."""
    user = _get_user(db, user_id)
    if user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Ce compte a ete supprime."
        )
    lien = f"{settings.frontend_url}/reset-password?token={creer_token_reset(user)}"
    if settings.environment != "production":
        print(f"[DEV] Lien de reinitialisation (admin) pour {user.email} : {lien}")
    envoyer_email_notification(
        user,
        "Reinitialisation de votre mot de passe",
        f"<p>Bonjour {escape(user.nom)},</p>"
        "<p>Un administrateur a demande la reinitialisation de votre mot de passe. "
        f'<a href="{lien}">Choisir un nouveau mot de passe</a> '
        f"(lien valable {DUREE_MINUTES} minutes).</p>",
    )
    logger_action_admin(
        db,
        admin_id=admin.id,
        action="lien_reinitialisation_envoye",
        cible_type="user",
        cible_id=str(user_id),
    )
    return {"message": "Lien envoye a l'adresse du compte."}


# ---------- suppression definitive ----------
class PurgeIn(BaseModel):
    email_confirmation: str
    mot_de_passe: MotDePasseSaisi


@router.post("/utilisateurs/{user_id}/purger")
def purger_immediatement(
    user_id: uuid.UUID,
    payload: PurgeIn,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Efface definitivement un compte et ses donnees (demande RGPD), sans attendre 30 jours."""
    _verifier_mdp(admin, payload.mot_de_passe)
    user = _get_user(db, user_id)
    if user.id == admin.id or user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte administrateur ne peut pas etre efface depuis l'application.",
        )
    if payload.email_confirmation.strip().lower() != user.email.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'email saisi ne correspond pas au compte.",
        )
    uid, type_profil = user.id, user.type_profil
    try:
        _purger_utilisateur(db, uid)
        db.commit()
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Suppression impossible."
        ) from exc
    (Path(settings.cv_storage_dir) / f"{uid}.pdf").unlink(missing_ok=True)
    logger_action_admin(
        db,
        admin_id=admin.id,
        action="purge_compte",
        cible_type="user",
        cible_id=str(uid),
        details=f"profil {type_profil}",
    )
    return {"message": "Compte et donnees effaces definitivement."}


# ---------- annonces ----------
class AnnonceIn(BaseModel):
    titre: str = Field(min_length=3, max_length=120)
    message: str = Field(min_length=3, max_length=1000)
    cible: Literal["tous", "etudiant", "freelance", "entreprise", "ecole"] = "tous"


@router.post("/annonces")
def envoyer_annonce(
    payload: AnnonceIn,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Notification in-app a tous les comptes actifs d'un groupe."""
    query = db.query(User.id).filter(User.is_active.is_(True), User.deleted_at.is_(None))
    if payload.cible != "tous":
        query = query.filter(User.type_profil == payload.cible)
    ids = [ligne[0] for ligne in query.all()]
    if not ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Aucun destinataire pour ce groupe."
        )
    db.add_all(
        Notification(
            id=uuid.uuid4(),
            user_id=uid,
            titre=payload.titre.strip(),
            message=payload.message.strip(),
            type_evenement="annonce",
        )
        for uid in ids
    )
    db.commit()
    logger_action_admin(
        db,
        admin_id=admin.id,
        action="annonce",
        cible_type="annonce",
        cible_id=payload.cible,
        details=f"{len(ids)} destinataire(s) : {payload.titre.strip()}",
    )
    return {"message": f"Annonce envoyee a {len(ids)} compte(s).", "destinataires": len(ids)}


# ---------- exports CSV ----------
def _cellule(valeur) -> str:
    if valeur is None:
        return ""
    if isinstance(valeur, (datetime, date)):
        return valeur.isoformat()
    texte = str(valeur)
    if texte and texte[0] in "=+-@\t\r":
        return "'" + texte  # neutralise les formules Excel
    return texte


def _csv(nom: str, entetes: list[str], lignes) -> Response:
    tampon = io.StringIO()
    ecrivain = csv.writer(tampon, delimiter=";")
    ecrivain.writerow(entetes)
    for ligne in lignes:
        ecrivain.writerow([_cellule(x) for x in ligne])
    contenu = ("\ufeff" + tampon.getvalue()).encode("utf-8")
    return Response(
        content=contenu,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{nom}"'},
    )


@router.get("/export/utilisateurs.csv")
def export_utilisateurs(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc(), User.id).all()
    reponse = _csv(
        "utilisateurs.csv",
        ["id", "nom", "email", "profil", "statut", "email_verifie", "admin", "inscrit_le"],
        (
            [
                u.id,
                u.nom,
                u.email,
                u.type_profil,
                _statut_compte(u),
                "oui" if u.email_verifie_at else "non",
                "oui" if u.is_admin else "non",
                u.created_at,
            ]
            for u in users
        ),
    )
    logger_action_admin(
        db,
        admin_id=admin.id,
        action="export_donnees",
        cible_type="export",
        cible_id="utilisateurs",
        details=f"{len(users)} ligne(s)",
    )
    return reponse


@router.get("/export/offres.csv")
def export_offres(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    nb = (
        db.query(Candidature.offre_id.label("oid"), func.count(Candidature.id).label("n"))
        .group_by(Candidature.offre_id)
        .subquery()
    )
    lignes = (
        db.query(Offre, User.nom, func.coalesce(nb.c.n, 0))
        .join(EntrepriseProfile, EntrepriseProfile.id == Offre.entreprise_id)
        .join(User, User.id == EntrepriseProfile.user_id)
        .outerjoin(nb, nb.c.oid == Offre.id)
        .order_by(Offre.created_at.desc(), Offre.id)
        .all()
    )
    reponse = _csv(
        "offres.csv",
        ["id", "titre", "entreprise", "contrat", "statut", "localisation", "candidatures", "creee"],
        (
            [o.id, o.titre, nom, o.type_contrat, o.statut, o.localisation, n, o.created_at]
            for o, nom, n in lignes
        ),
    )
    logger_action_admin(
        db,
        admin_id=admin.id,
        action="export_donnees",
        cible_type="export",
        cible_id="offres",
        details=f"{len(lignes)} ligne(s)",
    )
    return reponse


# ---------- journal filtrable ----------
@router.get("/journal", response_model=list[AdminLogOut])
def journal_filtre(
    action: str | None = Query(default=None, max_length=60),
    cible_id: str | None = Query(default=None, max_length=64),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(AdminLog, User.nom).outerjoin(User, User.id == AdminLog.admin_id)
    if action:
        query = query.filter(AdminLog.action == action)
    if cible_id and cible_id.strip():
        query = query.filter(AdminLog.cible_id == cible_id.strip())
    lignes = (
        query.order_by(AdminLog.created_at.desc(), AdminLog.id).offset(offset).limit(limit).all()
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
