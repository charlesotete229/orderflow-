
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import Base, engine
from app import models

from app.routers import (
    client,
    produit,
    commande,
    paiement,
    facture,
    authentification,
    utilisateur,
    statistiques
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="OrderFlow API",
    description="API de gestion commerciale et des commandes",
    version="1.0.0"
)

# Configuration CORS : autoriser le frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enregistrement des routeurs
app.include_router(client.router)
app.include_router(produit.router)
app.include_router(commande.router)
app.include_router(paiement.router)
app.include_router(facture.router)
app.include_router(authentification.router)
app.include_router(utilisateur.router)
app.include_router(statistiques.router)


@app.get("/")
def accueil():
    return {"message": "Bienvenue sur OrderFlow API"}


@app.get("/test-db")
def tester_connexion():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "message": "Connexion à MySQL réussie !"
        }

    except Exception as erreur:
        return {
            "message": "Échec de la connexion à MySQL",
            "erreur": str(erreur)
        }
