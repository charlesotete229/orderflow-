
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


# Informations retournées lors de la consultation d'une facture
class FactureResponse(BaseModel):
    id: int
    numero_facture: str
    commande_id: int
    montant_total: Decimal
    statut: str
    date_emission: datetime

    model_config = ConfigDict(from_attributes=True)
