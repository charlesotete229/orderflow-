
from getpass import getpass

from app.database import SessionLocal
from app.models.utilisateur import Utilisateur
from app.services.securite import hacher_mot_de_passe


def creer_admin():
    db = SessionLocal()

    try:
        print("\n=== CRÉATION DU PREMIER ADMINISTRATEUR ORDERFLOW ===\n")

        nombre_admins = db.query(Utilisateur).filter(
            Utilisateur.role == "ADMINISTRATEUR"
        ).count()

        if nombre_admins > 0:
            print("Un administrateur existe déjà.")
            return

        nom = input("Nom : ").strip()
        prenom = input("Prénom : ").strip()
        email = input("Adresse e-mail : ").strip().lower()

        mot_de_passe = getpass("Mot de passe : ")
        confirmation = getpass("Confirmer le mot de passe : ")

        if not nom or not prenom or not email:
            print("Tous les champs sont obligatoires.")
            return

        if len(mot_de_passe) < 8:
            print("Le mot de passe doit contenir au moins 8 caractères.")
            return

        if mot_de_passe != confirmation:
            print("Les mots de passe ne correspondent pas.")
            return

        utilisateur_existant = db.query(Utilisateur).filter(
            Utilisateur.email == email
        ).first()

        if utilisateur_existant:
            print("Cette adresse e-mail est déjà utilisée.")
            return

        nouvel_admin = Utilisateur(
            nom=nom,
            prenom=prenom,
            email=email,
            mot_de_passe=hacher_mot_de_passe(mot_de_passe),
            role="ADMINISTRATEUR",
            actif=True
        )

        db.add(nouvel_admin)
        db.commit()
        db.refresh(nouvel_admin)

        print("\nAdministrateur créé avec succès !")
        print(f"Identifiant : {nouvel_admin.id}")
        print(f"Nom : {nouvel_admin.nom} {nouvel_admin.prenom}")
        print(f"Rôle : {nouvel_admin.role}")

    except Exception as erreur:
        db.rollback()
        print("Erreur lors de la création :", str(erreur))

    finally:
        db.close()


if __name__ == "__main__":
    creer_admin()
