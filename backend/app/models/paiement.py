
from sqlalchemy import (
    Column, Integer, String, Numeric,
    DateTime, ForeignKey, func
)
from app.database import Base


class Paiement(Base):
    __tablename__ = "paiements"

    id = Column(Integer, primary_key=True, index=True)

    commande_id = Column(
        Integer,
        ForeignKey("commandes.id", ondelete="CASCADE"),
        nullable=False
    )

    montant = Column(Numeric(12, 2), nullable=False)

    mode_paiement = Column(
        String(50),
        nullable=False
    )

    reference_paiement = Column(
        String(100),
        unique=True,
        nullable=True
    )

    statut = Column(
        String(30),
        nullable=False,
        default="EN_ATTENTE"
    )

    date_paiement = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )
