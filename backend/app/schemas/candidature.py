import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.offre import OffreOut


class CandidatureCreate(BaseModel):
    offre_id: uuid.UUID
    message: str | None = Field(default=None, max_length=2000)


class CandidatureStatutUpdate(BaseModel):
    statut: Literal["recue", "en_cours", "entretien", "refusee", "acceptee"]


class CandidatureOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    offre_id: uuid.UUID
    candidat_id: uuid.UUID
    message: str | None
    statut: str
    created_at: datetime
    offre: OffreOut | None = None


class CandidatureRecue(BaseModel):
    """Vue entreprise : une candidature avec le nom du candidat et le titre de l'offre."""

    id: uuid.UUID
    offre_id: uuid.UUID
    candidat_id: uuid.UUID
    message: str | None
    statut: str
    created_at: datetime
    offre_titre: str
    candidat_nom: str
