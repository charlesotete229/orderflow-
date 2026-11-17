
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# Détail d'un produit dans une commande
class DetailCommandeCreate(BaseModel):
    produit_id: int = Field(gt=0)
    quantite: int = Field(gt=0)


# Informations nécessaires pour créer une commande
class CommandeCreate(BaseModel):
    # Facultatif pour permettre les ventes aux clients de passage
    client_id: int | None = Field(default=None, gt=0)

    utilisateur_id: int | None = Field(default=None, gt=0)

    canal_commande: Literal[
        "EN_LIGNE",
        "GESTIONNAIRE"
    ] = "GESTIONNAIRE"

    details: list[DetailCommandeCreate] = Field(min_length=1)


# Informations nécessaires pour modifier une commande
class CommandeUpdate(BaseModel):
    canal_commande: Literal[
        "EN_LIGNE",
        "GESTIONNAIRE"
    ]

    details: list[DetailCommandeCreate] = Field(min_length=1)


# Réponse pour un détail de commande
class DetailCommandeResponse(BaseModel):
    id: int
    produit_id: int
    quantite: int
    prix_unitaire: Decimal
    sous_total: Decimal

    model_config = ConfigDict(from_attributes=True)


# Réponse complète d'une commande
class CommandeResponse(BaseModel):
    id: int
    numero_commande: str

    # Une commande peut ne pas avoir de client associé
    client_id: int | None

    utilisateur_id: int | None
    canal_commande: str
    statut: str
    montant_total: Decimal
    date_commande: datetime
    details: list[DetailCommandeResponse]

    model_config = ConfigDict(from_attributes=True)
