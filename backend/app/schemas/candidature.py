import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.offre import OffreOut


class CandidatureCreate(BaseModel):
    offre_id: uuid.UUID
    message: str | None = Field(default=None, max_length=2000)


class CandidatureStatutUpdate(BaseModel):
    statut: Literal["recue", "en_cours", "entretien", "refusee", "acceptee"]


class CandidatureOut(BaseModel):
    id: uuid.UUID
    offre_id: uuid.UUID
    candidat_id: uuid.UUID
    message: str | None
    statut: str
    created_at: datetime
    offre: OffreOut | None = None

    class Config:
        from_attributes = True
