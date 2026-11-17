
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.produit import Produit
from app.models.detail_commande import DetailCommande
from app.schemas.produit import (
    ProduitCreate,
    ProduitUpdate,
    ProduitResponse
)
from app.routers.authentification import get_utilisateur_connecte


router = APIRouter(
    prefix="/produits",
    tags=["Produits"]
)


# Connexion à la base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 1. Ajouter un produit
@router.post(
    "/",
    response_model=ProduitResponse,
    status_code=status.HTTP_201_CREATED
)
def creer_produit(
    produit: ProduitCreate,
    db: Session = Depends(get_db),
    utilisateur=Depends(get_utilisateur_connecte)
):
    reference_existante = db.query(Produit).filter(
        Produit.reference == produit.reference
    ).first()

    if reference_existante:
        raise HTTPException(
            status_code=400,
            detail="Cette référence de produit existe déjà."
        )

    nouveau_produit = Produit(**produit.model_dump())

    db.add(nouveau_produit)
    db.commit()
    db.refresh(nouveau_produit)

    return nouveau_produit


# 2. Afficher tous les produits
@router.get(
    "/",
    response_model=list[ProduitResponse]
)
def afficher_produits(
    db: Session = Depends(get_db),
    utilisateur=Depends(get_utilisateur_connecte)
):
    return db.query(Produit).order_by(
        Produit.id.desc()
    ).all()


# 3. Consulter un produit par son ID
@router.get(
    "/{produit_id}",
    response_model=ProduitResponse
)
def consulter_produit(
    produit_id: int,
    db: Session = Depends(get_db),
    utilisateur=Depends(get_utilisateur_connecte)
):
    produit = db.query(Produit).filter(
        Produit.id == produit_id
    ).first()

    if not produit:
        raise HTTPException(
            status_code=404,
            detail="Produit introuvable."
        )

    return produit


# 4. Modifier un produit
@router.put(
    "/{produit_id}",
    response_model=ProduitResponse
)
def modifier_produit(
    produit_id: int,
    donnees: ProduitUpdate,
    db: Session = Depends(get_db),
    utilisateur=Depends(get_utilisateur_connecte)
):
    produit = db.query(Produit).filter(
        Produit.id == produit_id
    ).first()

    if not produit:
        raise HTTPException(
            status_code=404,
            detail="Produit introuvable."
        )

    reference_existante = db.query(Produit).filter(
        Produit.reference == donnees.reference,
        Produit.id != produit_id
    ).first()

    if reference_existante:
        raise HTTPException(
            status_code=400,
            detail="Cette référence est déjà utilisée par un autre produit."
        )

    for champ, valeur in donnees.model_dump().items():
        setattr(produit, champ, valeur)

    db.commit()
    db.refresh(produit)

    return produit


# 5. Supprimer un produit
@router.delete("/{produit_id}")
def supprimer_produit(
    produit_id: int,
    db: Session = Depends(get_db),
    utilisateur=Depends(get_utilisateur_connecte)
):
    produit = db.query(Produit).filter(
        Produit.id == produit_id
    ).first()

    if not produit:
        raise HTTPException(
            status_code=404,
            detail="Produit introuvable."
        )

    # Vérifier si le produit figure dans une commande
    produit_utilise = db.query(DetailCommande).filter(
        DetailCommande.produit_id == produit_id
    ).first()

    if produit_utilise:
        raise HTTPException(
            status_code=409,
            detail=(
                "Ce produit est associé à une commande. "
                "Désactivez-le au lieu de le supprimer."
            )
        )

    db.delete(produit)
    db.commit()

    return {
        "message": "Produit supprimé avec succès."
    }
