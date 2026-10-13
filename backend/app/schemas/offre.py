import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

DisponibiliteOffre = Literal["immediate", "1_mois", "3_mois", "6_mois"]


class OffreCreate(BaseModel):
    titre: str = Field(min_length=3)
    description: str | None = None
    type_contrat: Literal["stage", "cdd", "cdi", "mission"]
    competences_obligatoires: str | None = None
    competences_souhaitees: str | None = None
    soft_skills: str | None = None
    niveau_experience: str | None = None
    disponibilite: DisponibiliteOffre | None = None
    localisation: str | None = None
    remuneration: float | None = Field(default=None, ge=0)
    budget_tjm: float | None = Field(default=None, ge=0)


class OffreUpdate(BaseModel):
    titre: str | None = Field(default=None, min_length=3)
    description: str | None = None
    type_contrat: Literal["stage", "cdd", "cdi", "mission"] | None = None
    competences_obligatoires: str | None = None
    competences_souhaitees: str | None = None
    soft_skills: str | None = None
    niveau_experience: str | None = None
    disponibilite: DisponibiliteOffre | None = None
    localisation: str | None = None
    remuneration: float | None = Field(default=None, ge=0)
    budget_tjm: float | None = Field(default=None, ge=0)
    statut: Literal["active", "expiree", "archivee"] | None = None


class OffreOut(BaseModel):
    id: uuid.UUID
    entreprise_id: uuid.UUID
    titre: str
    description: str | None
    type_contrat: str
    competences_obligatoires: str | None
    competences_souhaitees: str | None
    soft_skills: str | None
    niveau_experience: str | None
    disponibilite: str | None  # tolerant : ne casse pas la lecture de donnees existantes
    localisation: str | None
    remuneration: float | None
    budget_tjm: float | None
    statut: str
    created_at: datetime

    class Config:
        from_attributes = True
