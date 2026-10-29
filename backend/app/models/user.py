import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, String, false

from app.core.database import Base
from app.core.types import GUID


class User(Base):
    __tablename__ = "users"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)

    nom = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    mot_de_passe_hash = Column(String, nullable=False)

    type_profil = Column(
        Enum("etudiant", "entreprise", "ecole", "freelance", name="type_profil"),
        nullable=False,
    )
    is_admin = Column(Boolean, nullable=False, default=False)

    # RGPD (decisions section 6.1 du recap projet)
    consent_given_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    consent_version = Column(String, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)  # suppression logique (soft delete)

    is_active = Column(Boolean, default=True)

    # contact WhatsApp (facultatif)
    telephone = Column(String, nullable=True)
    # le talent autorise les entreprises aupres desquelles il postule a voir son numero
    telephone_partage = Column(Boolean, nullable=False, default=False, server_default=false())

    email_verifie_at = Column(DateTime, nullable=True)
    mot_de_passe_modifie_at = Column(DateTime, nullable=True)  # invalide les anciennes sessions

    @property
    def email_verifie(self) -> bool:
        return self.email_verifie_at is not None
