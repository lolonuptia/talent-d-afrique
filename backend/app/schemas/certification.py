import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class CertificationCreate(BaseModel):
    intitule: str = Field(min_length=1, max_length=200)
    organisme: str | None = Field(default=None, max_length=200)
    date_obtention: date | None = None
    url_verification: str | None = Field(default=None, max_length=500)


class CertificationOut(CertificationCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID