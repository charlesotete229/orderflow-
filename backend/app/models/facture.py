
from sqlalchemy import (
    Column, Integer, String, Numeric,
    DateTime, ForeignKey, func
)
from app.database import Base


class Facture(Base):
    __tablename__ = "factures"

    id = Column(Integer, primary_key=True, index=True)

    numero_facture = Column(
        String(50),
        unique=True,
        nullable=False
    )

    commande_id = Column(
        Integer,
        ForeignKey("commandes.id"),
        unique=True,
        nullable=False
    )

    montant_total = Column(
        Numeric(12, 2),
        nullable=False
    )

    statut = Column(
        String(30),
        nullable=False,
        default="NON_PAYEE"
    )

    date_emission = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )
