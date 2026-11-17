from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.database import Base


class Utilisateur(Base):
    __tablename__ = "utilisateurs"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    mot_de_passe = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False, default="GESTIONNAIRE")
    actif = Column(Boolean, nullable=False, default=True)
    date_creation = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )