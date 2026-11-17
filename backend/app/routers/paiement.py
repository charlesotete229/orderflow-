
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.commande import Commande
from app.models.paiement import Paiement
from app.models.facture import Facture
from app.models.utilisateur import Utilisateur

from app.schemas.paiement import (
    PaiementCreate,
    PaiementResponse
)

from app.routers.authentification import get_utilisateur_connecte


router = APIRouter(
    prefix="/paiements",
    tags=["Paiements"],
    dependencies=[Depends(get_utilisateur_connecte)]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 1. Enregistrer un paiement
@router.post(
    "/",
    response_model=PaiementResponse,
    status_code=status.HTTP_201_CREATED
)
def enregistrer_paiement(
    donnees: PaiementCreate,
    db: Session = Depends(get_db)
):
    try:
        commande = db.query(Commande).filter(
            Commande.id == donnees.commande_id
        ).with_for_update().first()

        if not commande:
            raise HTTPException(
                status_code=404,
                detail="Commande introuvable."
            )

        if commande.statut in {"ANNULEE", "LIVREE", "TERMINEE"}:
            raise HTTPException(
                status_code=400,
                detail="Cette commande ne peut pas recevoir de paiement."
            )

        paiements = db.query(Paiement).filter(
            Paiement.commande_id == commande.id,
            Paiement.statut == "VALIDE"
        ).all()

        montant_deja_paye = sum(
            (paiement.montant for paiement in paiements),
            start=commande.montant_total * 0
        )

        solde_restant = commande.montant_total - montant_deja_paye

        if solde_restant <= 0:
            raise HTTPException(
                status_code=400,
                detail="Cette commande est déjà entièrement payée."
            )

        if donnees.montant > solde_restant:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Montant supérieur au solde restant. "
                    f"Solde à payer : {solde_restant}."
                )
            )

        nouveau_paiement = Paiement(
            commande_id=commande.id,
            montant=donnees.montant,
            mode_paiement=donnees.mode_paiement,
            reference_paiement=donnees.reference_paiement,
            statut="VALIDE"
        )

        db.add(nouveau_paiement)

        nouveau_total_paye = montant_deja_paye + donnees.montant

        if nouveau_total_paye >= commande.montant_total:
            commande.statut = "PAYEE"
        else:
            commande.statut = "PARTIELLEMENT_PAYEE"

        facture = db.query(Facture).filter(
            Facture.commande_id == commande.id
        ).with_for_update().first()

        if facture:
            if nouveau_total_paye >= facture.montant_total:
                facture.statut = "PAYEE"
            elif nouveau_total_paye > 0:
                facture.statut = "PARTIELLEMENT_PAYEE"
            else:
                facture.statut = "NON_PAYEE"

        db.commit()
        db.refresh(nouveau_paiement)

        return nouveau_paiement

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


# 2. Afficher tous les paiements
@router.get("/", response_model=list[PaiementResponse])
def afficher_paiements(
    db: Session = Depends(get_db)
):
    return db.query(Paiement).order_by(
        Paiement.id.desc()
    ).all()


# 3. Consulter les paiements d'une commande
@router.get(
    "/commande/{commande_id}",
    response_model=list[PaiementResponse]
)
def paiements_par_commande(
    commande_id: int,
    db: Session = Depends(get_db)
):
    commande = db.query(Commande).filter(
        Commande.id == commande_id
    ).first()

    if not commande:
        raise HTTPException(
            status_code=404,
            detail="Commande introuvable."
        )

    return db.query(Paiement).filter(
        Paiement.commande_id == commande_id
    ).order_by(Paiement.id.desc()).all()


# 4. Afficher les 5 paiements les plus récents
@router.get("/recents")
def afficher_paiements_recents(
    db: Session = Depends(get_db)
):
    paiements = (
        db.query(Paiement)
        .order_by(Paiement.date_paiement.desc())
        .limit(5)
        .all()
    )

    resultats = []

    for paiement in paiements:
        commande = db.query(Commande).filter(
            Commande.id == paiement.commande_id
        ).first()

        resultats.append({
            "id": paiement.id,
            "numero_commande": (
                commande.numero_commande
                if commande else "Commande inconnue"
            ),
            "montant": float(paiement.montant),
            "mode_paiement": paiement.mode_paiement,
            "reference_paiement": paiement.reference_paiement,
            "statut": paiement.statut,
            "date_paiement": paiement.date_paiement
        })

    return resultats
