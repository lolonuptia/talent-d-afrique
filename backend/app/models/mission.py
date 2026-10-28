import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.types import GUID


class Mission(Base):
    __tablename__ = "missions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    candidature_id = Column(
        GUID(), ForeignKey("candidatures.id", ondelete="CASCADE"), nullable=False, index=True
    )
    titre = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    date_debut = Column(Date, nullable=True)
    date_fin = Column(Date, nullable=True)
    avancement = Column(Integer, nullable=False, default=0)  # 0 a 100
    statut = Column(
        Enum("en_cours", "en_pause", "terminee", "annulee", name="statut_mission"),
        nullable=False,
        default="en_cours",
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    candidature = relationship("Candidature")
    jalons = relationship(
        "MissionJalon",
        cascade="all, delete-orphan",
        order_by="MissionJalon.position",
        back_populates="mission",
    )
    notes = relationship(
        "MissionNote",
        cascade="all, delete-orphan",
        order_by="MissionNote.created_at.desc()",
        back_populates="mission",
    )


class MissionJalon(Base):
    __tablename__ = "mission_jalons"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    mission_id = Column(
        GUID(), ForeignKey("missions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    titre = Column(String, nullable=False)
    date_prevue = Column(Date, nullable=True)
    fait = Column(Boolean, nullable=False, default=False)
    position = Column(Integer, nullable=False, default=0)

    mission = relationship("Mission", back_populates="jalons")


class MissionNote(Base):
    __tablename__ = "mission_notes"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    mission_id = Column(
        GUID(), ForeignKey("missions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    contenu = Column(Text, nullable=False)
    avancement = Column(Integer, nullable=True)  # avancement au moment de la note
    created_at = Column(DateTime, default=datetime.utcnow)

    mission = relationship("Mission", back_populates="notes")