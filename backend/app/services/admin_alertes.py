"""Alerte des administrateurs : une entreprise attend sa validation."""

from types import SimpleNamespace

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.profiles import EntrepriseProfile
from app.models.user import User
from app.services.email_template import alerte, badge, bouton, infos, titre
from app.services.notifications import creer_notification, envoyer_email_notification


def notifier_admins_nouvelle_entreprise(db: Session, entreprise: User, complet: bool = False) -> None:
    """Ne leve jamais d'exception : l'inscription ne doit pas echouer a cause d'une alerte."""
    try:
        profil = db.query(EntrepriseProfile).filter(EntrepriseProfile.user_id == entreprise.id).first()
        inscrit = entreprise.created_at.strftime("%d/%m/%Y a %H:%M") if entreprise.created_at else None
        lignes = [
            ("Entreprise", entreprise.nom),
            ("Email", entreprise.email),
            ("Telephone", entreprise.telephone),
            ("Inscrite le", inscrit),
        ]
        if profil is not None:
            lignes += [
                ("Secteur", profil.secteur),
                ("Taille", profil.taille),
                ("Localisation", profil.localisation),
                ("Description", (profil.description or "")[:300]),
                ("Logo", profil.logo_url),
            ]
        lien = f"{settings.frontend_url}/admin/utilisateurs/{entreprise.id}"
        sujet = "Dossier entreprise complet à valider" if complet else "Nouvelle entreprise à valider"
        html = (
            f"<p style='margin:0 0 14px'>{badge('À valider')}</p>"
            + titre(sujet, "Une entreprise attend votre décision")
            + "<p style='margin:0 0 14px'>Merci de vérifier les informations ci-dessous, "
            "puis de confirmer ou de refuser son adhésion.</p>"
            + infos(lignes)
            + bouton(lien, "Ouvrir la fiche et décider")
            + alerte("Tant que vous n'avez pas validé, l'entreprise ne peut ni publier d'offres ni chercher des talents.")
        )
        deja = set()
        admins = (
            db.query(User)
            .filter(User.is_admin.is_(True), User.is_active.is_(True), User.deleted_at.is_(None))
            .all()
        )
        for a in admins:
            creer_notification(
                db,
                user_id=a.id,
                titre=sujet,
                message=f"{entreprise.nom} ({entreprise.email}) attend votre validation.",
                type_evenement="entreprise_a_valider",
            )
            envoyer_email_notification(a, sujet, html)
            deja.add(a.email.lower())
        extra = (settings.admin_email or "").strip()
        if extra and extra.lower() not in deja:
            envoyer_email_notification(SimpleNamespace(email=extra), sujet, html)
    except Exception as exc:  # noqa: BLE001
        print(f"[ALERTE ADMIN] echec : {exc}")