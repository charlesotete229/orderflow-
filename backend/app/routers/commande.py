
from uuid import uuid4
from decimal import Decimal
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.client import Client
from app.models.utilisateur import Utilisateur
from app.models.produit import Produit
from app.models.commande import Commande
from app.models.detail_commande import DetailCommande
from app.models.paiement import Paiement

from app.schemas.commande import (
    CommandeCreate,
    CommandeUpdate,
    CommandeResponse
)

from app.routers.authentification import get_utilisateur_connecte


router = APIRouter(
    prefix="/commandes",
    tags=["Commandes"]
)


# Connexion à la base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Construire la réponse d'une commande avec ses détails
def construire_reponse_commande(db: Session, commande: Commande):
    details = db.query(DetailCommande).filter(
        DetailCommande.commande_id == commande.id
    ).all()

    return {
        "id": commande.id,
        "numero_commande": commande.numero_commande,
        "client_id": commande.client_id,
        "utilisateur_id": commande.utilisateur_id,
        "canal_commande": commande.canal_commande,
        "statut": commande.statut,
        "montant_total": commande.montant_total,
        "date_commande": commande.date_commande,
        "details": details
    }


# 1. Créer une commande
@router.post(
    "/",
    response_model=CommandeResponse,
    status_code=status.HTTP_201_CREATED
)
def creer_commande(
    donnees: CommandeCreate,
    db: Session = Depends(get_db),
    utilisateur_connecte: Utilisateur = Depends(get_utilisateur_connecte)
):
    try:
        # Vérifier le client uniquement si un identifiant est fourni
        if donnees.client_id is not None:
            client = db.query(Client).filter(
                Client.id == donnees.client_id
            ).first()

            if not client:
                raise HTTPException(
                    status_code=404,
                    detail="Client introuvable."
                )

        # Déterminer le gestionnaire associé à la commande
        utilisateur_id = utilisateur_connecte.id

        if donnees.utilisateur_id is not None:
            if (
                donnees.utilisateur_id != utilisateur_connecte.id
                and utilisateur_connecte.role != "ADMINISTRATEUR"
            ):
                raise HTTPException(
                    status_code=403,
                    detail="Vous ne pouvez pas attribuer cette commande à un autre utilisateur."
                )

            utilisateur = db.query(Utilisateur).filter(
                Utilisateur.id == donnees.utilisateur_id
            ).first()

            if not utilisateur:
                raise HTTPException(
                    status_code=404,
                    detail="Utilisateur introuvable."
                )

            if not utilisateur.actif:
                raise HTTPException(
                    status_code=400,
                    detail="Cet utilisateur est désactivé."
                )

            utilisateur_id = utilisateur.id

        # Empêcher les doublons de produits
        produits_ids = [
            detail.produit_id for detail in donnees.details
        ]

        if len(produits_ids) != len(set(produits_ids)):
            raise HTTPException(
                status_code=400,
                detail="Un même produit ne doit apparaître qu'une seule fois."
            )

        # Vérifier les produits et les stocks
        produits_commande = []
        montant_total = Decimal("0.00")

        for detail in donnees.details:
            produit = db.query(Produit).filter(
                Produit.id == detail.produit_id
            ).with_for_update().first()

            if not produit:
                raise HTTPException(
                    status_code=404,
                    detail=f"Le produit ID {detail.produit_id} est introuvable."
                )

            if not produit.actif:
                raise HTTPException(
                    status_code=400,
                    detail=f"Le produit {produit.nom} est désactivé."
                )

            if produit.quantite_stock < detail.quantite:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Stock insuffisant pour {produit.nom}. "
                        f"Stock disponible : {produit.quantite_stock}."
                    )
                )

            sous_total = produit.prix_unitaire * detail.quantite
            montant_total += sous_total

            produits_commande.append({
                "produit": produit,
                "quantite": detail.quantite,
                "prix_unitaire": produit.prix_unitaire,
                "sous_total": sous_total
            })

        # Générer un numéro de commande unique
        numero = (
            "CMD-"
            + datetime.now().strftime("%Y%m%d")
            + "-"
            + uuid4().hex[:6].upper()
        )

        # Enregistrer la commande
        nouvelle_commande = Commande(
            numero_commande=numero,
            client_id=donnees.client_id,
            utilisateur_id=utilisateur_id,
            canal_commande=donnees.canal_commande,
            statut="EN_ATTENTE",
            montant_total=montant_total
        )

        db.add(nouvelle_commande)
        db.flush()

        # Enregistrer les détails et actualiser les stocks
        for element in produits_commande:
            produit = element["produit"]

            nouveau_detail = DetailCommande(
                commande_id=nouvelle_commande.id,
                produit_id=produit.id,
                quantite=element["quantite"],
                prix_unitaire=element["prix_unitaire"],
                sous_total=element["sous_total"]
            )

            db.add(nouveau_detail)

            produit.quantite_stock -= element["quantite"]

        db.commit()
        db.refresh(nouvelle_commande)

        return construire_reponse_commande(
            db,
            nouvelle_commande
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


# 2. Afficher toutes les commandes
@router.get(
    "/",
    response_model=list[CommandeResponse]
)
def afficher_commandes(
    db: Session = Depends(get_db),
    utilisateur_connecte: Utilisateur = Depends(get_utilisateur_connecte)
):
    commandes = db.query(Commande).order_by(
        Commande.id.desc()
    ).all()

    return [
        construire_reponse_commande(db, commande)
        for commande in commandes
    ]


# 3. Afficher les 5 commandes les plus récentes
@router.get("/recentes")
def afficher_commandes_recentes(
    db: Session = Depends(get_db),
    utilisateur_connecte: Utilisateur = Depends(get_utilisateur_connecte)
):
    commandes = (
        db.query(Commande)
        .order_by(Commande.date_commande.desc())
        .limit(5)
        .all()
    )

    resultats = []

    for commande in commandes:
        client = None

        if commande.client_id is not None:
            client = db.query(Client).filter(
                Client.id == commande.client_id
            ).first()

        resultats.append({
            "id": commande.id,
            "numero_commande": commande.numero_commande,
            "client": (
                f"{client.prenom} {client.nom}"
                if client else "Client de passage"
            ),
            "montant_total": float(commande.montant_total),
            "statut": commande.statut,
            "date_commande": commande.date_commande
        })

    return resultats


# 4. Consulter une commande par son ID
@router.get(
    "/{commande_id}",
    response_model=CommandeResponse
)
def consulter_commande(
    commande_id: int,
    db: Session = Depends(get_db),
    utilisateur_connecte: Utilisateur = Depends(get_utilisateur_connecte)
):
    commande = db.query(Commande).filter(
        Commande.id == commande_id
    ).first()

    if not commande:
        raise HTTPException(
            status_code=404,
            detail="Commande introuvable."
        )

    return construire_reponse_commande(
        db,
        commande
    )


# 5. Modifier une commande
@router.put(
    "/{commande_id}",
    response_model=CommandeResponse
)
def modifier_commande(
    commande_id: int,
    donnees: CommandeUpdate,
    db: Session = Depends(get_db),
    utilisateur_connecte: Utilisateur = Depends(get_utilisateur_connecte)
):
    try:
        # Vérifier l'existence de la commande
        commande = db.query(Commande).filter(
            Commande.id == commande_id
        ).with_for_update().first()

        if not commande:
            raise HTTPException(
                status_code=404,
                detail="Commande introuvable."
            )

        # Empêcher la modification des commandes finalisées
        statuts_interdits = {
            "PAYEE",
            "PARTIELLEMENT_PAYEE",
            "TERMINEE",
            "LIVREE",
            "ANNULEE"
        }

        if commande.statut in statuts_interdits:
            raise HTTPException(
                status_code=400,
                detail="Cette commande ne peut plus être modifiée."
            )

        # Empêcher la modification si un paiement existe
        paiement_existant = db.query(Paiement).filter(
            Paiement.commande_id == commande_id
        ).first()

        if paiement_existant:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Cette commande possède déjà un paiement enregistré. "
                    "Elle ne peut plus être modifiée."
                )
            )

        # Vérifier les doublons de produits
        produits_ids = [
            detail.produit_id for detail in donnees.details
        ]

        if len(produits_ids) != len(set(produits_ids)):
            raise HTTPException(
                status_code=400,
                detail="Un même produit ne doit apparaître qu'une seule fois."
            )

        # Récupérer les anciens détails
        anciens_details = db.query(DetailCommande).filter(
            DetailCommande.commande_id == commande_id
        ).all()

        anciennes_quantites = {}

        for detail in anciens_details:
            anciennes_quantites[detail.produit_id] = (
                anciennes_quantites.get(detail.produit_id, 0)
                + detail.quantite
            )

        # Récupérer tous les produits concernés
        tous_les_ids = sorted(
            set(anciennes_quantites.keys()) | set(produits_ids)
        )

        produits = db.query(Produit).filter(
            Produit.id.in_(tous_les_ids)
        ).order_by(Produit.id).with_for_update().all()

        produits_dict = {
            produit.id: produit for produit in produits
        }

        # Vérifier les nouveaux produits
        for produit_id in produits_ids:
            if produit_id not in produits_dict:
                raise HTTPException(
                    status_code=404,
                    detail=f"Le produit ID {produit_id} est introuvable."
                )

            produit = produits_dict[produit_id]

            if not produit.actif:
                raise HTTPException(
                    status_code=400,
                    detail=f"Le produit {produit.nom} est désactivé."
                )

        nouvelles_quantites = {}
        nouveaux_details = []
        nouveau_montant_total = Decimal("0.00")

        # Calculer les nouvelles quantités et le montant
        for detail in donnees.details:
            produit = produits_dict[detail.produit_id]

            ancienne_quantite = anciennes_quantites.get(
                produit.id, 0
            )

            stock_disponible = (
                produit.quantite_stock + ancienne_quantite
            )

            if stock_disponible < detail.quantite:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Stock insuffisant pour {produit.nom}. "
                        f"Stock disponible : {stock_disponible}."
                    )
                )

            sous_total = (
                produit.prix_unitaire * detail.quantite
            )

            nouveau_montant_total += sous_total

            nouvelles_quantites[produit.id] = detail.quantite

            nouveaux_details.append({
                "produit_id": produit.id,
                "quantite": detail.quantite,
                "prix_unitaire": produit.prix_unitaire,
                "sous_total": sous_total
            })

        # Actualiser les stocks
        for produit_id in tous_les_ids:
            produit = produits_dict[produit_id]

            ancienne_quantite = anciennes_quantites.get(
                produit_id, 0
            )

            nouvelle_quantite = nouvelles_quantites.get(
                produit_id, 0
            )

            produit.quantite_stock += (
                ancienne_quantite - nouvelle_quantite
            )

        # Supprimer les anciens détails
        for detail in anciens_details:
            db.delete(detail)

        # Enregistrer les nouveaux détails
        for element in nouveaux_details:
            nouveau_detail = DetailCommande(
                commande_id=commande.id,
                produit_id=element["produit_id"],
                quantite=element["quantite"],
                prix_unitaire=element["prix_unitaire"],
                sous_total=element["sous_total"]
            )

            db.add(nouveau_detail)

        # Actualiser le montant total
        commande.montant_total = nouveau_montant_total

        # Actualiser le canal de commande
        commande.canal_commande = donnees.canal_commande

        db.commit()
        db.refresh(commande)

        return construire_reponse_commande(
            db,
            commande
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


# 6. Annuler une commande
@router.patch(
    "/{commande_id}/annuler",
    response_model=CommandeResponse
)
def annuler_commande(
    commande_id: int,
    db: Session = Depends(get_db),
    utilisateur_connecte: Utilisateur = Depends(get_utilisateur_connecte)
):
    try:
        # Vérifier l'existence de la commande
        commande = db.query(Commande).filter(
            Commande.id == commande_id
        ).with_for_update().first()

        if not commande:
            raise HTTPException(
                status_code=404,
                detail="Commande introuvable."
            )

        # Vérifier si la commande est déjà annulée
        if commande.statut == "ANNULEE":
            raise HTTPException(
                status_code=400,
                detail="Cette commande est déjà annulée."
            )

        # Vérifier si la commande peut être annulée
        if commande.statut != "EN_ATTENTE":
            raise HTTPException(
                status_code=400,
                detail="Seules les commandes en attente peuvent être annulées."
            )

        # Vérifier si un paiement existe
        paiement = db.query(Paiement).filter(
            Paiement.commande_id == commande_id
        ).first()

        if paiement:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Cette commande possède un paiement enregistré. "
                    "Veuillez traiter le paiement avant l'annulation."
                )
            )

        # Récupérer les détails de la commande
        details = db.query(DetailCommande).filter(
            DetailCommande.commande_id == commande_id
        ).all()

        if not details:
            raise HTTPException(
                status_code=400,
                detail="Cette commande ne possède aucun détail."
            )

        # Verrouiller les produits concernés
        produits_ids = sorted({
            detail.produit_id for detail in details
        })

        produits = db.query(Produit).filter(
            Produit.id.in_(produits_ids)
        ).order_by(Produit.id).with_for_update().all()

        produits_dict = {
            produit.id: produit for produit in produits
        }

        # Restaurer les stocks
        for detail in details:
            produit = produits_dict.get(detail.produit_id)

            if not produit:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"Le produit ID {detail.produit_id} "
                        "est introuvable."
                    )
                )

            produit.quantite_stock += detail.quantite

        # Modifier le statut de la commande
        commande.statut = "ANNULEE"

        db.commit()
        db.refresh(commande)

        return construire_reponse_commande(
            db,
            commande
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise
