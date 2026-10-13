import uuid

from pydantic import BaseModel, ConfigDict, Field


class PortfolioItemCreate(BaseModel):
    titre: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    url: str | None = Field(default=None, max_length=500)
    image_url: str | None = Field(default=None, max_length=500)


class PortfolioItemOut(PortfolioItemCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID