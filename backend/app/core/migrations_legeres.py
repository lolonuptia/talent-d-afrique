"""Ajoute les colonnes et tables manquantes sur une base PostgreSQL existante (idempotent)."""

from sqlalchemy import inspect, text

from app.core.database import Base
from app.models.revoked_token import RevokedToken  # noqa: F401


def appliquer_migrations_legeres(engine) -> None:
    if engine.dialect.name != "postgresql":
        return
    Base.metadata.create_all(bind=engine)  # cree les tables manquantes, ne modifie pas les autres
    insp = inspect(engine)
    colonnes_users = {c["name"] for c in insp.get_columns("users")}
    colonnes_entretiens = {c["name"] for c in insp.get_columns("entretiens")}
    with engine.begin() as conn:
        if "email_verifie_at" not in colonnes_users:
            conn.execute(text("ALTER TABLE users ADD COLUMN email_verifie_at TIMESTAMP"))
            # les comptes existants sont consideres comme verifies
            conn.execute(
                text(
                    "UPDATE users SET email_verifie_at = "
                    "COALESCE(created_at, (NOW() AT TIME ZONE 'UTC'))"
                )
            )
        if "mot_de_passe_modifie_at" not in colonnes_users:
            conn.execute(text("ALTER TABLE users ADD COLUMN mot_de_passe_modifie_at TIMESTAMP"))
        if "fuseau" not in colonnes_entretiens:
            conn.execute(text("ALTER TABLE entretiens ADD COLUMN fuseau VARCHAR"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS verif_code_hash VARCHAR"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS verif_code_expire_at TIMESTAMP"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS verif_code_envoye_at TIMESTAMP"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS verif_code_essais INTEGER NOT NULL DEFAULT 0"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS statut_validation VARCHAR NOT NULL DEFAULT 'validee'"))
