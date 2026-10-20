import uuid
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, String

from app.core.database import Base
from app.core.types import GUID


class Certification(Base):
    __tablename__ = "certifications"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    intitule = Column(String, nullable=False)
    organisme = Column(String, nullable=True)
    date_obtention = Column(Date, nullable=True)
    url_verification = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
