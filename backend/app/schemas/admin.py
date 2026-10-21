import uuid
from datetime import datetime

from pydantic import BaseModel


class AdminLogOut(BaseModel):
    id: uuid.UUID
    admin_id: uuid.UUID
    admin_nom: str | None = None
    action: str
    cible_type: str
    cible_id: str
    details: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class StatistiquesGlobales(BaseModel):
    total_utilisateurs: int
    total_etudiants: int
    total_entreprises: int
    total_ecoles: int
    total_freelances: int
    total_offres_actives: int
    total_offres: int
    total_candidatures: int
    taux_matching_moyen: float
    comptes_suspendus: int = 0
    entreprises_non_verifiees: int = 0
