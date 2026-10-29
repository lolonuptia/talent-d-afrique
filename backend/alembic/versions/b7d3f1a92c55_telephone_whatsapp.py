"""telephone WhatsApp et consentement de partage

Revision ID: b7d3f1a92c55
Revises: a1c4e7f93b20
"""
import sqlalchemy as sa
from alembic import op

revision = "b7d3f1a92c55"
down_revision = "a1c4e7f93b20"
branch_labels = None
depends_on = None


def _colonnes(insp, table):
    return {c["name"] for c in insp.get_columns(table)}


def upgrade() -> None:
    insp = sa.inspect(op.get_bind())
    cols = _colonnes(insp, "users")
    if "telephone" not in cols:
        op.add_column("users", sa.Column("telephone", sa.String(), nullable=True))
    if "telephone_partage" not in cols:
        op.add_column(
            "users",
            sa.Column("telephone_partage", sa.Boolean(), nullable=False, server_default=sa.false()),
        )


def downgrade() -> None:
    insp = sa.inspect(op.get_bind())
    cols = _colonnes(insp, "users")
    if "telephone_partage" in cols:
        op.drop_column("users", "telephone_partage")
    if "telephone" in cols:
        op.drop_column("users", "telephone")