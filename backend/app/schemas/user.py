import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    nom: str = Field(min_length=2)
    email: EmailStr
    mot_de_passe: str = Field(min_length=8)
    type_profil: Literal["etudiant", "entreprise", "ecole", "freelance"]
    consentement: bool
    consent_version: str


class UserLogin(BaseModel):
    email: EmailStr
    mot_de_passe: str


class UserUpdate(BaseModel):
    nom: str | None = Field(default=None, min_length=2)
    email: EmailStr | None = None


class UserOut(BaseModel):
    id: uuid.UUID
    nom: str
    email: EmailStr
    type_profil: str
    is_admin: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut
