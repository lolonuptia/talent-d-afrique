import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.offre import OffreOut


class FavoriCreate(BaseModel):
    offre_id: uuid.UUID


class FavoriOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    offre_id: uuid.UUID
    created_at: datetime
    offre: OffreOut | None = None
