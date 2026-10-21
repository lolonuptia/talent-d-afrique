import uuid
from typing import Literal

from pydantic import BaseModel

from app.schemas.certification import CertificationOut
from app.schemas.portfolio import PortfolioItemOut


class TalentOut(BaseModel):
    """Vue publique d'un talent pour les entreprises : jamais d'email."""

    profile_id: uuid.UUID
    type_profil: Literal["etudiant", "freelance"]
    nom: str
    competences: list[str]
    disponibilite: str | None = None
    formations: str | None = None
    tjm: float | None = None
    annees_experience: int | None = None
    portfolio_url: str | None = None


class TalentDetailOut(TalentOut):
    certifications: list[CertificationOut] = []
    portfolio: list[PortfolioItemOut] = []


class CandidatDetailOut(TalentDetailOut):
    """Profil d'un candidat vu par l'entreprise a laquelle il a postule : jamais d'email."""

    experiences: str | None = None
    a_un_cv: bool = False
