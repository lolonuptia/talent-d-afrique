"""verification email, revocation des jetons, fuseau des entretiens

Revision ID: a1c4e7f93b20
Revises: 8df7211c4bb5
"""
import sqlalchemy as sa
from alembic import op

revision = "a1c4e7f93b20"
down_revision = "8df7211c4bb5"
branch_labels = None
depends_on = None


def _colonnes(insp, table):
    return {c["name"] for c in insp.get_columns(table)}


def upgrade() -> None:
    insp = sa.inspect(op.get_bind())

    colonnes_users = _colonnes(insp, "users")
    if "email_verifie_at" not in colonnes_users:
        op.add_column("users", sa.Column("email_verifie_at", sa.DateTime(), nullable=True))
        # les comptes existants sont consideres comme verifies
        op.execute(
            "UPDATE users SET email_verifie_at = "
            "COALESCE(created_at, (NOW() AT TIME ZONE 'UTC'))"
        )
    if "mot_de_passe_modifie_at" not in colonnes_users:
        op.add_column(
            "users", sa.Column("mot_de_passe_modifie_at", sa.DateTime(), nullable=True)
        )

    if "fuseau" not in _colonnes(insp, "entretiens"):
        op.add_column("entretiens", sa.Column("fuseau", sa.String(), nullable=True))

    if "revoked_tokens" not in insp.get_table_names():
        op.create_table(
            "revoked_tokens",
            sa.Column("jti", sa.String(), primary_key=True),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_revoked_tokens_expires_at", "revoked_tokens", ["expires_at"])


def downgrade() -> None:
    insp = sa.inspect(op.get_bind())
    if "revoked_tokens" in insp.get_table_names():
        op.drop_table("revoked_tokens")
    if "fuseau" in _colonnes(insp, "entretiens"):
        op.drop_column("entretiens", "fuseau")
    colonnes_users = _colonnes(insp, "users")
    if "mot_de_passe_modifie_at" in colonnes_users:
        op.drop_column("users", "mot_de_passe_modifie_at")
    if "email_verifie_at" in colonnes_users:
        op.drop_column("users", "email_verifie_at")