import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.types import GUID


class Entretien(Base):
    __tablename__ = "entretiens"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    candidature_id = Column(
        GUID(), ForeignKey("candidatures.id", ondelete="CASCADE"), nullable=False, index=True
    )

    date_heure = Column(DateTime, nullable=False)  # en UTC
    duree_minutes = Column(Integer, nullable=False, default=30)
    mode = Column(
        Enum("visio", "presentiel", "telephone", name="mode_entretien"),
        nullable=False,
        default="visio",
    )
    lieu_ou_lien = Column(String, nullable=True)
    message = Column(Text, nullable=True)  # instructions visibles par le candidat

    statut = Column(
        Enum("planifie", "annule", "termine", name="statut_entretien"),
        nullable=False,
        default="planifie",
    )

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    candidature = relationship("Candidature")