import uuid
from datetime import datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, EmailStr, Field, field_validator


def _normaliser_email(v):
    return v.strip().lower() if isinstance(v, str) else v


def _max_72_octets(v: str) -> str:
    if len(v.encode("utf-8")) > 72:
        raise ValueError("Le mot de passe est trop long (72 octets maximum).")
    return v


MotDePasseSaisi = Annotated[str, AfterValidator(_max_72_octets)]
MotDePasse = Annotated[str, Field(min_length=8), AfterValidator(_max_72_octets)]


class UserCreate(BaseModel):
    nom: str = Field(min_length=2)
    email: EmailStr
    mot_de_passe: MotDePasse
    type_profil: Literal["etudiant", "entreprise", "ecole", "freelance"]
    consentement: bool
    consent_version: str

    _norm_email = field_validator("email", mode="before")(_normaliser_email)


class UserLogin(BaseModel):
    email: EmailStr
    mot_de_passe: MotDePasseSaisi

    _norm_email = field_validator("email", mode="before")(_normaliser_email)


class UserUpdate(BaseModel):
    nom: str | None = Field(default=None, min_length=2)
    email: EmailStr | None = None
    mot_de_passe_actuel: MotDePasseSaisi | None = None

    _norm_email = field_validator("email", mode="before")(_normaliser_email)


class UserOut(BaseModel):
    id: uuid.UUID
    nom: str
    email: EmailStr
    type_profil: str
    is_admin: bool = False
    email_verifie: bool = True
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


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    mot_de_passe: MotDePasse


class ChangePasswordRequest(BaseModel):
    ancien_mot_de_passe: MotDePasseSaisi
    nouveau_mot_de_passe: MotDePasse


class VerifyEmailRequest(BaseModel):
    token: str
