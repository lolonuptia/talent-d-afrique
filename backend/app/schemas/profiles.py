import re
import uuid
from typing import Literal

from pydantic import BaseModel, Field, field_validator

DisponibiliteCandidat = Literal["immediate", "1_mois", "3_mois", "6_mois"]


def _url_http(v: str | None) -> str | None:
    """Accepte uniquement http(s) : refuse javascript:, data:, etc."""
    if v is None:
        return None
    v = v.strip()
    if not v:
        return None
    if not re.match(r"^https?://\S+$", v, re.IGNORECASE):
        raise ValueError("L'adresse doit commencer par http:// ou https://")
    return v


class EntrepriseProfileIn(BaseModel):
    logo_url: str | None = None
    description: str | None = None
    secteur: str | None = None
    taille: str | None = None
    culture: str | None = None
    localisation: str | None = None

    _val_logo = field_validator("logo_url")(_url_http)


class EntrepriseProfileOut(EntrepriseProfileIn):
    id: uuid.UUID
    user_id: uuid.UUID

    class Config:
        from_attributes = True


class EtudiantProfileIn(BaseModel):
    cv_url: str | None = None
    competences: str | None = None
    experiences: str | None = None
    formations: str | None = None
    disponibilite: DisponibiliteCandidat | None = None
    visible_aux_entreprises: bool | None = None
    preferences: str | None = None
    ecole_id: uuid.UUID | None = None


class EtudiantProfileOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    cv_url: str | None = None
    competences: str | None = None
    experiences: str | None = None
    formations: str | None = None
    disponibilite: str | None = None  # tolerant : ne casse pas la lecture de donnees existantes
    visible_aux_entreprises: bool = False
    preferences: str | None = None
    ecole_id: uuid.UUID | None = None

    class Config:
        from_attributes = True


class EcoleProfileIn(BaseModel):
    nom_etablissement: str | None = None
    description: str | None = None
    localisation: str | None = None


class EcoleProfileOut(EcoleProfileIn):
    id: uuid.UUID
    user_id: uuid.UUID

    class Config:
        from_attributes = True


class FreelanceProfileIn(BaseModel):
    competences: str | None = None
    tjm: float | None = Field(default=None, ge=0)
    disponibilite: DisponibiliteCandidat | None = None
    visible_aux_entreprises: bool | None = None
    portfolio_url: str | None = None
    annees_experience: int | None = Field(default=None, ge=0)

    _val_portfolio = field_validator("portfolio_url")(_url_http)


class FreelanceProfileOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    competences: str | None = None
    tjm: float | None = None
    disponibilite: str | None = None  # tolerant : ne casse pas la lecture de donnees existantes
    visible_aux_entreprises: bool = False
    portfolio_url: str | None = None
    annees_experience: int | None = None

    class Config:
        from_attributes = True
