
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.client import Client
from app.schemas.client import (
    ClientCreate,
    ClientUpdate,
    ClientResponse
)
from app.routers.authentification import get_utilisateur_connecte


router = APIRouter(
    prefix="/clients",
    tags=["Clients"]
)


# Connexion à la base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 1. Créer un client
@router.post(
    "/",
    response_model=ClientResponse,
    status_code=status.HTTP_201_CREATED
)
def creer_client(
    client: ClientCreate,
    db: Session = Depends(get_db),
    utilisateur=Depends(get_utilisateur_connecte)
):
    telephone_existant = db.query(Client).filter(
        Client.telephone == client.telephone
    ).first()

    if telephone_existant:
        raise HTTPException(
            status_code=400,
            detail="Ce numéro de téléphone est déjà utilisé."
        )

    if client.email:
        email_existant = db.query(Client).filter(
            Client.email == client.email
        ).first()

        if email_existant:
            raise HTTPException(
                status_code=400,
                detail="Cette adresse email est déjà utilisée."
            )

    nouveau_client = Client(**client.model_dump())

    db.add(nouveau_client)
    db.commit()
    db.refresh(nouveau_client)

    return nouveau_client


# 2. Afficher tous les clients
@router.get(
    "/",
    response_model=list[ClientResponse]
)
def afficher_clients(
    db: Session = Depends(get_db),
    utilisateur=Depends(get_utilisateur_connecte)
):
    return db.query(Client).order_by(
        Client.id.desc()
    ).all()


# 3. Consulter un client par son ID
@router.get(
    "/{client_id}",
    response_model=ClientResponse
)
def consulter_client(
    client_id: int,
    db: Session = Depends(get_db),
    utilisateur=Depends(get_utilisateur_connecte)
):
    client = db.query(Client).filter(
        Client.id == client_id
    ).first()

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Client introuvable."
        )

    return client


# 4. Modifier un client
@router.put(
    "/{client_id}",
    response_model=ClientResponse
)
def modifier_client(
    client_id: int,
    donnees: ClientUpdate,
    db: Session = Depends(get_db),
    utilisateur=Depends(get_utilisateur_connecte)
):
    client = db.query(Client).filter(
        Client.id == client_id
    ).first()

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Client introuvable."
        )

    telephone_existant = db.query(Client).filter(
        Client.telephone == donnees.telephone,
        Client.id != client_id
    ).first()

    if telephone_existant:
        raise HTTPException(
            status_code=400,
            detail="Ce numéro de téléphone est déjà utilisé."
        )

    if donnees.email:
        email_existant = db.query(Client).filter(
            Client.email == donnees.email,
            Client.id != client_id
        ).first()

        if email_existant:
            raise HTTPException(
                status_code=400,
                detail="Cette adresse email est déjà utilisée."
            )

    for champ, valeur in donnees.model_dump().items():
        setattr(client, champ, valeur)

    db.commit()
    db.refresh(client)

    return client


# 5. Supprimer un client
@router.delete("/{client_id}")
def supprimer_client(
    client_id: int,
    db: Session = Depends(get_db),
    utilisateur=Depends(get_utilisateur_connecte)
):
    client = db.query(Client).filter(
        Client.id == client_id
    ).first()

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Client introuvable."
        )

    db.delete(client)
    db.commit()

    return {
        "message": "Client supprimé avec succès."
    }
