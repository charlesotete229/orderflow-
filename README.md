# OrderFlow – Application de gestion commerciale

**OrderFlow** est une application web de gestion commerciale conçue pour faciliter et centraliser les opérations quotidiennes d'une entreprise.

Elle permet de gérer les clients, les produits, les commandes, les paiements et les factures depuis une interface moderne, intuitive et sécurisée.

L'objectif est de simplifier le suivi des activités commerciales, d'améliorer l'organisation des données et de réduire les tâches administratives.

## Fonctionnalités principales

### Gestion des clients
- Ajouter, modifier et supprimer des clients.
- Consulter les informations des clients.
- Rechercher rapidement un client.

### Gestion des produits
- Ajouter, modifier et supprimer des produits.
- Gérer les références et les prix.
- Suivre les quantités disponibles en stock.
- Consulter l'état du stock.

### Gestion des commandes
- Enregistrer de nouvelles commandes.
- Associer une commande à un client.
- Ajouter plusieurs produits à une commande.
- Calculer automatiquement le montant total.
- Suivre le statut des commandes.

### Gestion des paiements
- Enregistrer les paiements.
- Prendre en charge plusieurs modes de paiement.
- Consulter l'historique des paiements.
- Suivre les montants payés et les soldes restants.

### Gestion des factures
- Générer des factures au format PDF.
- Consulter les détails des factures.
- Envoyer les factures par e-mail.
- Suivre la situation des factures.

### Gestion des utilisateurs
- Créer et gérer les comptes utilisateurs.
- Attribuer des rôles.
- Activer ou désactiver des comptes.
- Contrôler les accès selon les permissions.

### Tableau de bord
- Consulter les statistiques commerciales.
- Suivre les commandes et les paiements.
- Visualiser les principales informations de l'activité.

## Technologies utilisées

| Partie | Technologies |
|---|---|
| Backend | Python, FastAPI |
| Frontend | React.js, JavaScript |
| Base de données | MySQL |
| ORM | SQLAlchemy |
| Validation des données | Pydantic |
| Authentification | JWT |
| Sécurité des mots de passe | Argon2 |
| Styles | Tailwind CSS |
| Animations | Framer Motion |
| Icônes | Lucide React |
| Graphiques | Recharts |
| Gestion des requêtes HTTP | Axios |
| Génération PDF | ReportLab |
| Versionnement | Git et GitHub |

## Architecture du projet

```text
OrderFlow/
│
├── backend/
│   └── app/
│       ├── models/
│       ├── routers/
│       ├── schemas/
│       ├── services/
│       ├── database.py
│       ├── main.py
│       └── creer_admin.py
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── pages/
│       ├── routes/
│       ├── App.jsx
│       └── main.jsx
│
└── .gitignore
```

## Installation et lancement

### 1. Cloner le dépôt

```bash
git clone https://github.com/charlesotete229/orderflow-.git
cd orderflow-
```

### 2. Configuration du backend

Accéder au dossier backend :

```bash
cd backend
```

Créer un environnement virtuel :

```bash
python -m venv .venv
```

Activer l'environnement virtuel sous Windows :

```bash
.venv\Scripts\activate
```

Installer les dépendances :

```bash
pip install -r requirements.txt
```

Créer un fichier `.env` à partir des paramètres nécessaires au projet, notamment :
- La connexion à la base de données MySQL.
- La clé secrète JWT.
- Les paramètres SMTP pour l'envoi des e-mails.

Créer la base de données MySQL `orderflow_db`, puis configurer les variables d'environnement.

Lancer le serveur :

```bash
python -m uvicorn app.main:app --reload
```

Documentation interactive de l'API :

http://127.0.0.1:8000/docs

### 3. Configuration du frontend

Ouvrir un deuxième terminal et accéder au dossier frontend :

```bash
cd frontend
```

Installer les dépendances :

```bash
npm install
```

Lancer l'application :

```bash
npm run dev
```

Accéder à l'application :

http://localhost:5173/

## Sécurité

OrderFlow intègre plusieurs mécanismes de sécurité :

- Authentification basée sur JWT.
- Hachage des mots de passe avec Argon2.
- Protection des routes.
- Gestion des rôles et des autorisations.
- Utilisation de variables d'environnement pour les informations sensibles.

## Perspectives d'évolution

Plusieurs améliorations pourront être envisagées :

- Développement d'une application mobile.
- Intégration de solutions de paiement en ligne.
- Amélioration des outils de reporting.
- Ajout de nouvelles fonctionnalités de gestion commerciale.

## Auteur

**Charles OTETE**

Développeur Full Stack

Projet réalisé dans le cadre d'un apprentissage pratique du développement web Full Stack.

---

*OrderFlow – Simplifier la gestion commerciale, centraliser les opérations.*
