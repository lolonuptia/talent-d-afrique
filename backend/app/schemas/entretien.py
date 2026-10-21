import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ModeEntretien = Literal["visio", "presentiel", "telephone"]
StatutEntretien = Literal["planifie", "annule", "termine"]


class EntretienCreate(BaseModel):
    candidature_id: uuid.UUID
    date_heure: datetime
    duree_minutes: int = Field(default=30, ge=5, le=480)
    mode: ModeEntretien = "visio"
    fuseau: str | None = Field(default=None, max_length=64)
    lieu_ou_lien: str | None = Field(default=None, max_length=500)
    message: str | None = Field(default=None, max_length=2000)


class EntretienUpdate(BaseModel):
    date_heure: datetime | None = None
    duree_minutes: int | None = Field(default=None, ge=5, le=480)
    mode: ModeEntretien | None = None
    fuseau: str | None = Field(default=None, max_length=64)
    lieu_ou_lien: str | None = Field(default=None, max_length=500)
    message: str | None = Field(default=None, max_length=2000)
    statut: StatutEntretien | None = None


class EntretienOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    candidature_id: uuid.UUID
    date_heure: datetime
    duree_minutes: int
    mode: str
    lieu_ou_lien: str | None = None
    fuseau: str | None = None
    message: str | None = None
    statut: str
