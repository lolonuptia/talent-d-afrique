import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

StatutMission = Literal["en_cours", "en_pause", "terminee", "annulee"]


class JalonCreate(BaseModel):
    titre: str = Field(min_length=1, max_length=200)
    date_prevue: date | None = None


class JalonUpdate(BaseModel):
    titre: str | None = Field(default=None, min_length=1, max_length=200)
    date_prevue: date | None = None
    fait: bool | None = None


class JalonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    titre: str
    date_prevue: date | None = None
    fait: bool
    position: int


class NoteCreate(BaseModel):
    contenu: str = Field(min_length=1, max_length=2000)


class NoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    contenu: str
    avancement: int | None = None
    created_at: datetime


class MissionCreate(BaseModel):
    candidature_id: uuid.UUID
    titre: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    date_debut: date | None = None
    date_fin: date | None = None
    jalons: list[str] = Field(default_factory=list, max_length=30)


class MissionUpdate(BaseModel):
    titre: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    date_debut: date | None = None
    date_fin: date | None = None
    avancement: int | None = Field(default=None, ge=0, le=100)
    statut: StatutMission | None = None


class MissionOut(BaseModel):
    id: uuid.UUID
    candidature_id: uuid.UUID
    titre: str
    description: str | None = None
    date_debut: date | None = None
    date_fin: date | None = None
    avancement: int
    statut: str
    created_at: datetime
    updated_at: datetime | None = None
    candidat_nom: str
    offre_titre: str
    jalons: list[JalonOut] = []
    notes: list[NoteOut] = []