import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Text

from app.core.database import Base
from app.core.types import GUID


class Message(Base):
    __tablename__ = "messages"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    candidature_id = Column(
        GUID(), ForeignKey("candidatures.id", ondelete="CASCADE"), nullable=False, index=True
    )
    expediteur_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    contenu = Column(Text, nullable=False)
    lue = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
