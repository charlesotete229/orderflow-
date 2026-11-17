
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# Informations nécessaires pour enregistrer un paiement
class PaiementCreate(BaseModel):
    commande_id: int = Field(gt=0)

    montant: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2
    )

    mode_paiement: Literal[
        "ESPECES",
        "MOBILE_MONEY",
        "VIREMENT"
    ]

    reference_paiement: str | None = Field(
        default=None,
        max_length=100
    )


# Informations retournées après un paiement
class PaiementResponse(BaseModel):
    id: int
    commande_id: int
    montant: Decimal
    mode_paiement: str
    reference_paiement: str | None
    statut: str
    date_paiement: datetime

    model_config = ConfigDict(from_attributes=True)
