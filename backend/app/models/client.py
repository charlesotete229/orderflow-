from sqlalchemy import Column, Integer, String, DateTime, func
from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    telephone = Column(String(20), unique=True, nullable=False)
    email = Column(String(150), unique=True, nullable=True)
    adresse = Column(String(255), nullable=True)
    date_creation = Column(DateTime, nullable=False, server_default=func.now())