
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProduitBase(BaseModel):
    nom: str = Field(min_length=2, max_length=150)

    description: str | None = None

    reference: str = Field(min_length=2, max_length=50)

    prix_unitaire: Decimal = Field(gt=0, max_digits=12, decimal_places=2)

    quantite_stock: int = Field(default=0, ge=0)

    actif: bool = True


class ProduitCreate(ProduitBase):
    pass


class ProduitUpdate(ProduitBase):
    pass


class ProduitResponse(ProduitBase):
    id: int
    date_creation: datetime

    model_config = ConfigDict(from_attributes=True)
