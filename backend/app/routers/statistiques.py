
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import SessionLocal
from app.models.client import Client
from app.models.produit import Produit
from app.models.commande import Commande
from app.models.paiement import Paiement
from app.routers.authentification import get_utilisateur_connecte


router = APIRouter(
    prefix="/statistiques",
    tags=["Statistiques"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/dashboard")
def obtenir_statistiques_dashboard(
    db: Session = Depends(get_db),
    utilisateur=Depends(get_utilisateur_connecte)
):
    total_clients = db.query(
        func.count(Client.id)
    ).scalar() or 0

    total_produits = db.query(
        func.count(Produit.id)
    ).scalar() or 0

    total_commandes = db.query(
        func.count(Commande.id)
    ).scalar() or 0

    # Total des paiements validés
    paiements_recus = (
        db.query(func.coalesce(func.sum(Paiement.montant), 0))
        .filter(Paiement.statut == "VALIDE")
        .scalar()
    )

    # Montant total des commandes non annulées
    montant_commandes = (
        db.query(func.coalesce(func.sum(Commande.montant_total), 0))
        .filter(Commande.statut != "ANNULEE")
        .scalar()
    )

    # Paiements validés concernant les commandes non annulées
    paiements_commandes = (
        db.query(func.coalesce(func.sum(Paiement.montant), 0))
        .join(Commande, Paiement.commande_id == Commande.id)
        .filter(
            Paiement.statut == "VALIDE",
            Commande.statut != "ANNULEE"
        )
        .scalar()
    )

    # Calcul du reste à encaisser
    reste_a_encaisser = max(
        0,
        float(montant_commandes) - float(paiements_commandes)
    )

    commandes_en_attente = (
        db.query(func.count(Commande.id))
        .filter(Commande.statut == "EN_ATTENTE")
        .scalar()
    ) or 0

    return {
        "total_clients": total_clients,
        "total_produits": total_produits,
        "total_commandes": total_commandes,
        "paiements_recus": float(paiements_recus),
        "reste_a_encaisser": reste_a_encaisser,
        "commandes_en_attente": commandes_en_attente
    }
