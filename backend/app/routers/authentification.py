
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jwt.exceptions import InvalidTokenError

from app.database import SessionLocal
from app.models.utilisateur import Utilisateur
from app.schemas.authentification import (
    ConnexionRequest,
    TokenResponse
)
from app.services.securite import verifier_mot_de_passe
from app.services.authentification import (
    creer_access_token,
    decoder_access_token
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentification"]
)


# Authentification HTTP Bearer pour Swagger
security = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Connexion d'un utilisateur
@router.post(
    "/connexion",
    response_model=TokenResponse
)
def connexion(
    donnees: ConnexionRequest,
    db: Session = Depends(get_db)
):
    utilisateur = db.query(Utilisateur).filter(
        Utilisateur.email == donnees.email
    ).first()

    if not utilisateur:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Adresse e-mail ou mot de passe incorrect."
        )

    if not utilisateur.actif:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce compte utilisateur est désactivé."
        )

    if not verifier_mot_de_passe(
        donnees.mot_de_passe,
        utilisateur.mot_de_passe
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Adresse e-mail ou mot de passe incorrect."
        )

    access_token = creer_access_token({
        "sub": str(utilisateur.id),
        "role": utilisateur.role
    })

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# Identifier l'utilisateur connecté
def get_utilisateur_connecte(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    erreur_authentification = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Jeton invalide ou expiré.",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        donnees = decoder_access_token(
            credentials.credentials
        )

        utilisateur_id = donnees.get("sub")

        if not utilisateur_id:
            raise erreur_authentification

        utilisateur_id = int(utilisateur_id)

    except (InvalidTokenError, ValueError, TypeError):
        raise erreur_authentification

    utilisateur = db.query(Utilisateur).filter(
        Utilisateur.id == utilisateur_id
    ).first()

    if not utilisateur or not utilisateur.actif:
        raise erreur_authentification

    return utilisateur


# Vérifier que l'utilisateur connecté est administrateur
def get_admin_connecte(
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte)
):
    if utilisateur.role != "ADMINISTRATEUR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs."
        )

    return utilisateur


# Récupérer les informations de l'utilisateur connecté
@router.get("/me")
def obtenir_profil(
    utilisateur: Utilisateur = Depends(get_utilisateur_connecte)
):
    return {
        "id": utilisateur.id,
        "nom": utilisateur.nom,
        "prenom": utilisateur.prenom,
        "email": utilisateur.email,
        "role": utilisateur.role,
        "actif": utilisateur.actif
    }
