
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.utilisateur import Utilisateur
from app.schemas.utilisateur import (
    UtilisateurCreate,
    UtilisateurUpdate,
    UtilisateurResponse
)
from app.services.securite import hacher_mot_de_passe
from app.routers.authentification import (
    get_db,
    get_admin_connecte
)


router = APIRouter(
    prefix="/utilisateurs",
    tags=["Utilisateurs"]
)


# Créer un utilisateur
@router.post(
    "/",
    response_model=UtilisateurResponse,
    status_code=status.HTTP_201_CREATED
)
def creer_utilisateur(
    donnees: UtilisateurCreate,
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(get_admin_connecte)
):
    utilisateur_existant = db.query(Utilisateur).filter(
        Utilisateur.email == donnees.email
    ).first()

    if utilisateur_existant:
        raise HTTPException(
            status_code=409,
            detail="Cette adresse e-mail est déjà utilisée."
        )

    nouveau_utilisateur = Utilisateur(
        nom=donnees.nom,
        prenom=donnees.prenom,
        email=donnees.email,
        mot_de_passe=hacher_mot_de_passe(
            donnees.mot_de_passe
        ),
        role=donnees.role,
        actif=True
    )

    try:
        db.add(nouveau_utilisateur)
        db.commit()
        db.refresh(nouveau_utilisateur)

        return nouveau_utilisateur

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Impossible de créer cet utilisateur."
        )


# Afficher tous les utilisateurs
@router.get(
    "/",
    response_model=list[UtilisateurResponse]
)
def afficher_utilisateurs(
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(get_admin_connecte)
):
    return db.query(Utilisateur).order_by(
        Utilisateur.id.desc()
    ).all()


# Consulter un utilisateur par son ID
@router.get(
    "/{utilisateur_id}",
    response_model=UtilisateurResponse
)
def consulter_utilisateur(
    utilisateur_id: int,
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(get_admin_connecte)
):
    utilisateur = db.query(Utilisateur).filter(
        Utilisateur.id == utilisateur_id
    ).first()

    if not utilisateur:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable."
        )

    return utilisateur


# Modifier les informations d'un utilisateur
@router.put(
    "/{utilisateur_id}",
    response_model=UtilisateurResponse
)
def modifier_utilisateur(
    utilisateur_id: int,
    donnees: UtilisateurUpdate,
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(get_admin_connecte)
):
    utilisateur = db.query(Utilisateur).filter(
        Utilisateur.id == utilisateur_id
    ).first()

    if not utilisateur:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable."
        )

    email_existant = db.query(Utilisateur).filter(
        Utilisateur.email == donnees.email,
        Utilisateur.id != utilisateur_id
    ).first()

    if email_existant:
        raise HTTPException(
            status_code=409,
            detail="Cette adresse e-mail est déjà utilisée."
        )

    # Empêcher un administrateur de retirer son propre rôle
    if (
        utilisateur.id == admin.id
        and donnees.role != "ADMINISTRATEUR"
    ):
        raise HTTPException(
            status_code=400,
            detail="Vous ne pouvez pas retirer votre propre rôle administrateur."
        )

    # Protéger le dernier administrateur actif
    if (
        utilisateur.role == "ADMINISTRATEUR"
        and utilisateur.actif
        and donnees.role != "ADMINISTRATEUR"
    ):
        nombre_admins_actifs = db.query(Utilisateur).filter(
            Utilisateur.role == "ADMINISTRATEUR",
            Utilisateur.actif == True
        ).count()

        if nombre_admins_actifs <= 1:
            raise HTTPException(
                status_code=400,
                detail="Impossible de retirer le rôle du dernier administrateur actif."
            )

    utilisateur.nom = donnees.nom
    utilisateur.prenom = donnees.prenom
    utilisateur.email = donnees.email
    utilisateur.role = donnees.role

    try:
        db.commit()
        db.refresh(utilisateur)
        return utilisateur

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Impossible de modifier cet utilisateur."
        )


# Activer un compte
@router.patch(
    "/{utilisateur_id}/activer",
    response_model=UtilisateurResponse
)
def activer_utilisateur(
    utilisateur_id: int,
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(get_admin_connecte)
):
    utilisateur = db.query(Utilisateur).filter(
        Utilisateur.id == utilisateur_id
    ).first()

    if not utilisateur:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable."
        )

    utilisateur.actif = True

    db.commit()
    db.refresh(utilisateur)

    return utilisateur


# Désactiver un compte
@router.patch(
    "/{utilisateur_id}/desactiver",
    response_model=UtilisateurResponse
)
def desactiver_utilisateur(
    utilisateur_id: int,
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(get_admin_connecte)
):
    utilisateur = db.query(Utilisateur).filter(
        Utilisateur.id == utilisateur_id
    ).first()

    if not utilisateur:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable."
        )

    if utilisateur.id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="Vous ne pouvez pas désactiver votre propre compte."
        )

    if (
        utilisateur.role == "ADMINISTRATEUR"
        and utilisateur.actif
    ):
        nombre_admins_actifs = db.query(Utilisateur).filter(
            Utilisateur.role == "ADMINISTRATEUR",
            Utilisateur.actif == True
        ).count()

        if nombre_admins_actifs <= 1:
            raise HTTPException(
                status_code=400,
                detail="Impossible de désactiver le dernier administrateur actif."
            )

    utilisateur.actif = False

    db.commit()
    db.refresh(utilisateur)

    return utilisateur


# Supprimer un utilisateur
@router.delete(
    "/{utilisateur_id}",
    status_code=status.HTTP_200_OK
)
def supprimer_utilisateur(
    utilisateur_id: int,
    db: Session = Depends(get_db),
    admin: Utilisateur = Depends(get_admin_connecte)
):
    utilisateur = db.query(Utilisateur).filter(
        Utilisateur.id == utilisateur_id
    ).first()

    if not utilisateur:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur introuvable."
        )

    if utilisateur.id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="Vous ne pouvez pas supprimer votre propre compte."
        )

    if utilisateur.role == "ADMINISTRATEUR":
        nombre_admins = db.query(Utilisateur).filter(
            Utilisateur.role == "ADMINISTRATEUR"
        ).count()

        nombre_admins_actifs = db.query(Utilisateur).filter(
            Utilisateur.role == "ADMINISTRATEUR",
            Utilisateur.actif == True
        ).count()

        if nombre_admins <= 1 or (
            utilisateur.actif and nombre_admins_actifs <= 1
        ):
            raise HTTPException(
                status_code=400,
                detail="Impossible de supprimer le dernier administrateur."
            )

    db.delete(utilisateur)
    db.commit()

    return {
        "message": "Utilisateur supprimé avec succès."
    }
