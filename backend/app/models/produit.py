
from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, func
from app.database import Base


class Produit(Base):
    __tablename__ = "produits"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    reference = Column(String(50), unique=True, nullable=False)
    prix_unitaire = Column(Numeric(12, 2), nullable=False)
    quantite_stock = Column(Integer, nullable=False, default=0)
    actif = Column(Boolean, nullable=False, default=True)
    date_creation = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )
