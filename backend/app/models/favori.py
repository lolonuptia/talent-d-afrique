import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.types import GUID


class Favori(Base):
    __tablename__ = "favoris"
    __table_args__ = (UniqueConstraint("user_id", "offre_id", name="uq_favori_user_offre"),)

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    offre_id = Column(GUID(), ForeignKey("offres.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    offre = relationship("Offre")
