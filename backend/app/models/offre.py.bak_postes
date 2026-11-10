import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.types import GUID


class Offre(Base):
    __tablename__ = "offres"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    entreprise_id = Column(GUID(), ForeignKey("entreprise_profiles.id"), nullable=False)

    titre = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    type_contrat = Column(
        Enum("stage", "cdd", "cdi", "mission", name="type_contrat"),
        nullable=False,
    )

    competences_obligatoires = Column(Text, nullable=True)
    competences_souhaitees = Column(Text, nullable=True)
    soft_skills = Column(Text, nullable=True)

    niveau_experience = Column(String, nullable=True)
    disponibilite = Column(String, nullable=True)
    localisation = Column(String, nullable=True)
    remuneration = Column(Float, nullable=True)
    budget_tjm = Column(
        Float, nullable=True
    )  # taux journalier propose, pour les missions freelance

    statut = Column(
        Enum("active", "expiree", "archivee", name="statut_offre"),
        nullable=False,
        default="active",
    )

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    entreprise = relationship("EntrepriseProfile")
