"""nombre_postes sur offres + statut pourvue"""
from alembic import op

revision = "71ba43308094"
down_revision = "b7d3f1a92c55"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE statut_offre ADD VALUE IF NOT EXISTS 'pourvue'")
    op.execute("ALTER TABLE offres ADD COLUMN IF NOT EXISTS nombre_postes INTEGER NOT NULL DEFAULT 1")


def downgrade():
    op.execute("ALTER TABLE offres DROP COLUMN IF EXISTS nombre_postes")