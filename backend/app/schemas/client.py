
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ClientBase(BaseModel):
    nom: str = Field(min_length=2, max_length=100)
    prenom: str = Field(min_length=2, max_length=100)
    telephone: str = Field(min_length=8, max_length=20)
    email: EmailStr | None = None
    adresse: str | None = Field(default=None, max_length=255)


class ClientCreate(ClientBase):
    pass


class ClientUpdate(ClientBase):
    pass


class ClientResponse(ClientBase):
    id: int
    date_creation: datetime

    model_config = ConfigDict(from_attributes=True)
