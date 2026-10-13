import uuid

from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, Text, false
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.types import GUID


class EntrepriseProfile(Base):
    __tablename__ = "entreprise_profiles"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), unique=True, nullable=False)

    logo_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    secteur = Column(String, nullable=True)
    taille = Column(String, nullable=True)  # ex: "1-10", "11-50", "50+"
    culture = Column(Text, nullable=True)
    localisation = Column(String, nullable=True)

    user = relationship("User")


class EtudiantProfile(Base):
    __tablename__ = "etudiant_profiles"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), unique=True, nullable=False)
    ecole_id = Column(GUID(), ForeignKey("ecole_profiles.id"), nullable=True)

    cv_url = Column(String, nullable=True)
    competences = Column(Text, nullable=True)  # liste separee par des virgules pour la V1
    experiences = Column(Text, nullable=True)
    formations = Column(Text, nullable=True)
    disponibilite = Column(String, nullable=True)  # ex: "immediate", "3 mois"
    preferences = Column(Text, nullable=True)
    visible_aux_entreprises = Column(
        Boolean, nullable=False, default=False, server_default=false()
    )

    user = relationship("User")
    ecole = relationship("EcoleProfile", back_populates="etudiants")


class EcoleProfile(Base):
    __tablename__ = "ecole_profiles"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), unique=True, nullable=False)

    nom_etablissement = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    localisation = Column(String, nullable=True)

    user = relationship("User")
    etudiants = relationship("EtudiantProfile", back_populates="ecole")


class FreelanceProfile(Base):
    __tablename__ = "freelance_profiles"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), unique=True, nullable=False)

    competences = Column(Text, nullable=True)
    tjm = Column(Float, nullable=True)  # taux journalier moyen
    disponibilite = Column(String, nullable=True)
    portfolio_url = Column(String, nullable=True)
    annees_experience = Column(Integer, nullable=True)
    visible_aux_entreprises = Column(
        Boolean, nullable=False, default=False, server_default=false()
    )

    user = relationship("User")
