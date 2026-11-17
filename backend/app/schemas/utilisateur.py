
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UtilisateurCreate(BaseModel):
    nom: str = Field(min_length=2, max_length=100)
    prenom: str = Field(min_length=2, max_length=100)
    email: EmailStr
    mot_de_passe: str = Field(min_length=8, max_length=128)
    role: Literal["ADMINISTRATEUR", "GESTIONNAIRE"] = "GESTIONNAIRE"


class UtilisateurUpdate(BaseModel):
    nom: str = Field(min_length=2, max_length=100)
    prenom: str = Field(min_length=2, max_length=100)
    email: EmailStr
    role: Literal["ADMINISTRATEUR", "GESTIONNAIRE"]


class UtilisateurResponse(BaseModel):
    id: int
    nom: str
    prenom: str
    email: EmailStr
    role: str
    actif: bool
    date_creation: datetime

    model_config = ConfigDict(from_attributes=True)
