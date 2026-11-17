
from sqlalchemy import Column, Integer, Numeric, ForeignKey
from app.database import Base


class DetailCommande(Base):
    __tablename__ = "details_commandes"

    id = Column(Integer, primary_key=True, index=True)

    commande_id = Column(
        Integer,
        ForeignKey("commandes.id", ondelete="CASCADE"),
        nullable=False
    )

    produit_id = Column(
        Integer,
        ForeignKey("produits.id"),
        nullable=False
    )

    quantite = Column(Integer, nullable=False)

    prix_unitaire = Column(Numeric(12, 2), nullable=False)

    sous_total = Column(Numeric(12, 2), nullable=False)
