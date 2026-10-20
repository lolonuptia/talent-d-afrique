import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MessageCreate(BaseModel):
    contenu: str = Field(min_length=1, max_length=2000)


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    candidature_id: uuid.UUID
    expediteur_id: uuid.UUID
    contenu: str
    lue: bool
    created_at: datetime


class ConversationOut(BaseModel):
    candidature_id: uuid.UUID
    offre_titre: str
    interlocuteur_nom: str
    dernier_message: str
    dernier_message_at: datetime
    non_lus: int
