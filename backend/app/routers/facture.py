
from uuid import uuid4
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.commande import Commande
from app.models.facture import Facture
from app.models.client import Client
from app.models.detail_commande import DetailCommande
from app.models.produit import Produit
from app.models.paiement import Paiement

from app.schemas.facture import FactureResponse

from app.services.facture_pdf import generer_pdf_facture
from app.services.email_service import envoyer_facture_email

from app.routers.authentification import get_utilisateur_connecte


router = APIRouter(
    prefix="/factures",
    tags=["Factures"],
    dependencies=[Depends(get_utilisateur_connecte)]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Préparer les données et générer le PDF
def preparer_pdf_facture(db: Session, facture: Facture):

    commande = db.query(Commande).filter(
        Commande.id == facture.commande_id
    ).first()

    if not commande:
        raise HTTPException(
            404,
            "Commande associée introuvable."
        )

    # Le client peut être absent
    client = None

    if commande.client_id is not None:
        client = db.query(Client).filter(
            Client.id == commande.client_id
        ).first()

    details = db.query(DetailCommande).filter(
        DetailCommande.commande_id == commande.id
    ).all()

    if not details:
        raise HTTPException(
            404,
            "Aucun détail trouvé pour cette commande."
        )

    produits_ids = list({
        detail.produit_id for detail in details
    })

    produits_liste = db.query(Produit).filter(
        Produit.id.in_(produits_ids)
    ).all()

    produits = {
        produit.id: produit
        for produit in produits_liste
    }

    paiements = db.query(Paiement).filter(
        Paiement.commande_id == commande.id,
        Paiement.statut == "VALIDE"
    ).all()

    montant_paye = sum(
        (paiement.montant for paiement in paiements),
        start=commande.montant_total * 0
    )

    pdf_buffer = generer_pdf_facture(
        facture=facture,
        commande=commande,
        client=client,
        details=details,
        produits=produits,
        montant_paye=montant_paye
    )

    return pdf_buffer, client


# 1. Créer une facture sans envoyer automatiquement un e-mail
@router.post(
    "/commande/{commande_id}",
    response_model=FactureResponse,
    status_code=status.HTTP_201_CREATED
)
def generer_facture(
    commande_id: int,
    db: Session = Depends(get_db)
):
    try:
        commande = db.query(Commande).filter(
            Commande.id == commande_id
        ).with_for_update().first()

        if not commande:
            raise HTTPException(
                404,
                "Commande introuvable."
            )

        if commande.statut == "ANNULEE":
            raise HTTPException(
                400,
                "Impossible de facturer une commande annulée."
            )

        facture_existante = db.query(Facture).filter(
            Facture.commande_id == commande_id
        ).first()

        if facture_existante:
            raise HTTPException(
                400,
                "Une facture existe déjà pour cette commande."
            )

        if commande.montant_total <= 0:
            raise HTTPException(
                400,
                "Le montant de la commande est invalide."
            )

        paiements = db.query(Paiement).filter(
            Paiement.commande_id == commande_id,
            Paiement.statut == "VALIDE"
        ).all()

        montant_paye = sum(
            (paiement.montant for paiement in paiements),
            start=commande.montant_total * 0
        )

        if montant_paye >= commande.montant_total:
            statut_facture = "PAYEE"
        elif montant_paye > 0:
            statut_facture = "PARTIELLEMENT_PAYEE"
        else:
            statut_facture = "NON_PAYEE"

        numero = (
            "FAC-"
            + datetime.now().strftime("%Y%m%d")
            + "-"
            + uuid4().hex[:6].upper()
        )

        nouvelle_facture = Facture(
            numero_facture=numero,
            commande_id=commande.id,
            montant_total=commande.montant_total,
            statut=statut_facture
        )

        db.add(nouvelle_facture)
        db.commit()
        db.refresh(nouvelle_facture)

        return nouvelle_facture

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


# 2. Afficher toutes les factures
@router.get(
    "/",
    response_model=list[FactureResponse]
)
def afficher_factures(
    db: Session = Depends(get_db)
):
    return db.query(Facture).order_by(
        Facture.id.desc()
    ).all()


# 3. Consulter une facture
@router.get(
    "/{facture_id}",
    response_model=FactureResponse
)
def consulter_facture(
    facture_id: int,
    db: Session = Depends(get_db)
):
    facture = db.query(Facture).filter(
        Facture.id == facture_id
    ).first()

    if not facture:
        raise HTTPException(
            404,
            "Facture introuvable."
        )

    return facture


# 4. Télécharger une facture PDF
@router.get("/{facture_id}/pdf")
def telecharger_facture_pdf(
    facture_id: int,
    db: Session = Depends(get_db)
):
    facture = db.query(Facture).filter(
        Facture.id == facture_id
    ).first()

    if not facture:
        raise HTTPException(
            404,
            "Facture introuvable."
        )

    pdf_buffer, client = preparer_pdf_facture(
        db,
        facture
    )

    nom_fichier = f"{facture.numero_facture}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{nom_fichier}"'
            )
        }
    )


# 5. Envoyer une facture par e-mail sur demande
@router.post("/{facture_id}/envoyer-email")
def renvoyer_facture_email(
    facture_id: int,
    db: Session = Depends(get_db)
):
    facture = db.query(Facture).filter(
        Facture.id == facture_id
    ).first()

    if not facture:
        raise HTTPException(
            404,
            "Facture introuvable."
        )

    pdf_buffer, client = preparer_pdf_facture(
        db,
        facture
    )

    if not client or not client.email:
        raise HTTPException(
            400,
            "Aucune adresse e-mail disponible pour cette facture."
        )

    try:
        envoyer_facture_email(
            destinataire=client.email,
            numero_facture=facture.numero_facture,
            pdf_content=pdf_buffer.getvalue()
        )

        return {
            "message": "Facture envoyée avec succès.",
            "numero_facture": facture.numero_facture,
            "destinataire": client.email
        }

    except Exception as erreur:
        raise HTTPException(
            status_code=502,
            detail=f"Échec de l'envoi de la facture : {str(erreur)}"
        )
