from sqlalchemy import Column, DateTime, String

from app.core.database import Base


class RevokedToken(Base):
    __tablename__ = "revoked_tokens"

    jti = Column(String, primary_key=True)
    expires_at = Column(DateTime, nullable=False, index=True)
