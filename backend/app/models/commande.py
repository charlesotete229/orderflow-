
from sqlalchemy import (
    Column, Integer, String, Numeric, DateTime,
    ForeignKey, func
)
from app.database import Base


class Commande(Base):
    __tablename__ = "commandes"

    id = Column(Integer, primary_key=True, index=True)

    numero_commande = Column(String(50), unique=True, nullable=False)

    # Le client peut être absent pour une vente à un client de passage
    client_id = Column(
        Integer,
        ForeignKey("clients.id"),
        nullable=True
    )

    utilisateur_id = Column(
        Integer,
        ForeignKey("utilisateurs.id", ondelete="SET NULL"),
        nullable=True
    )

    canal_commande = Column(
        String(30),
        nullable=False,
        default="EN_LIGNE"
    )

    statut = Column(
        String(30),
        nullable=False,
        default="EN_ATTENTE"
    )

    montant_total = Column(
        Numeric(12, 2),
        nullable=False,
        default=0
    )

    date_commande = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )
