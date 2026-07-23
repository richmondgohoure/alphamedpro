# Documentation technique — AlphaMedPro

## 1. Présentation

**AlphaMedPro** est une application de gestion de clinique médicale.
Elle permettra à terme de gérer les patients, les rendez-vous, les médecins,
le personnel, la facturation et la pharmacie de l'établissement.

Le squelette technique (backend, frontend, base de données, menu principal
de navigation) a été mis en place lors d'une première itération. Cette
itération ajoute le premier module métier : la gestion des **Patients**,
des **Assurances** (grilles tarifaires) et des **Garants**.

## 2. Stack technique

| Couche       | Technologie                          |
|--------------|----------------------------------------|
| Backend      | Java 21, Spring Boot 3.3.4 (Web, Data JPA, Validation) |
| Frontend     | React 19, Vite, react-router-dom, react-icons |
| Base de données | MySQL 8 (base `alphamedpro`)       |
| Build        | Maven (backend), npm (frontend)       |

## 3. Structure du dépôt

```
AlphaMedPro/
├── backend/                     # API Spring Boot
│   ├── pom.xml
│   └── src/main/java/com/alphamedpro/backend/
│       ├── AlphaMedProApplication.java   # point d'entrée
│       ├── HealthController.java         # endpoint GET /api/health
│       ├── config/CorsConfig.java        # autorise le frontend (CORS)
│       ├── common/                       # ResourceNotFoundException, GlobalExceptionHandler, ApiError
│       ├── patient/                      # Patient (entité, repository, service, controller, dto/)
│       ├── assurance/                     # Assurance (entité, repository, service, controller, dto/)
│       └── garant/                        # Garant (entité, repository, service, controller, dto/)
│   └── src/main/resources/application.properties
│
├── frontend/                    # application React
│   └── src/
│       ├── api/                      # http.js (client fetch) + patientsApi/assurancesApi/garantsApi
│       ├── components/
│       │   ├── TopBar.jsx / .css     # barre supérieure + bouton menu (hamburger)
│       │   ├── Sidebar.jsx / .css    # menu principal coulissant
│       │   ├── Modal.jsx / .css      # boîte de dialogue réutilisable
│       │   ├── PageHeader.jsx / .css # en-tête de page (titre + action)
│       │   ├── PatientForm.jsx       # formulaire patient (+ sélection assurances)
│       │   └── AssuranceForm.jsx     # formulaire assurance (tarifs + garants inline)
│       ├── pages/
│       │   ├── MainMenu.jsx / .css   # page d'accueil / tableau de bord
│       │   ├── Patients.jsx / .css   # liste + CRUD patients
│       │   └── Assurances.jsx / .css # liste + CRUD assurances et garants
│       ├── styles/                   # theme.css, table.css, form.css
│       └── App.jsx                   # routage par activeKey + vérification de connexion API
│
└── documentation technique.md   # ce document
```

## 4. Backend Spring Boot

### 4.1 Configuration base de données

Fichier : `backend/src/main/resources/application.properties`

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/alphamedpro?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=frawen25@
spring.jpa.hibernate.ddl-auto=update
server.port=8080
```

- La base `alphamedpro` est créée automatiquement si elle n'existe pas
  (option `createDatabaseIfNotExist=true`), à condition que l'utilisateur
  MySQL `root` ait les droits nécessaires.
- `spring.jpa.hibernate.ddl-auto=update` : les tables seront créées/mises à
  jour automatiquement à partir des futures entités JPA.

> ⚠️ Pour un environnement de production, ne jamais committer les
> identifiants réels dans le dépôt : utiliser des variables d'environnement
> (`SPRING_DATASOURCE_PASSWORD`, etc.) ou un fichier `application-local.properties`
> ignoré par git.

### 4.2 Endpoints disponibles

| Méthode | URL             | Description                          |
|---------|-----------------|---------------------------------------|
| GET     | `/api/health`   | Vérifie que le backend est actif (utilisé par le frontend pour afficher l'état de connexion) |

### 4.3 CORS

`CorsConfig.java` autorise les appels depuis `http://localhost:5173`
(serveur de développement Vite) vers les routes `/api/**`.

### 4.4 Modèle de données — Patients / Assurances / Garants

| Entité    | Champs                                                                                                                                                      | Relations |
|-----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| Patient   | nom, prénom, dateNaissance, numeroTelephone, quartier, profession                                                                                              | plusieurs-à-plusieurs avec Assurance, via l'entité d'association `PatientAssurance` |
| Assurance | libelle, ncc, numeroTelephone, email, prixConsultationGeneraliste, prixConsultationSpecialiste, coutB, coutZ, coutK, prixChambreTriple, prixChambreDouble, prixChambreIndividuelleSimple, prixChambreVip, prixChambreVvip | plusieurs-à-plusieurs avec Patient (partagée entre patients, via `PatientAssurance`) et avec Garant (table `assurance_garant`) |
| Garant    | libelle, numeroTelephone, email                                                                                                                                | plusieurs-à-plusieurs avec Assurance (un garant peut garantir plusieurs assurances) |
| PatientAssurance | numeroMatricule (numéro matricule de l'assuré, propre à ce couple patient/assurance)                                                                    | `@ManyToOne` vers Patient et vers Assurance — table `patient_assurance` |

La relation Patient ↔ Assurance n'est pas une simple table de jointure :
elle porte une donnée métier (le **numéro matricule** de l'assuré chez
cette assurance), qui peut être différente pour chaque patient et pour
chaque assurance à laquelle il est affilié. Elle est donc modélisée par
une entité d'association `PatientAssurance` (et non un `@ManyToMany`
classique).

Les tables (`patients`, `assurances`, `garants`, `patient_assurance`,
`assurance_garant`) sont créées automatiquement par Hibernate
(`spring.jpa.hibernate.ddl-auto=update`) au démarrage du backend.

### 4.5 Endpoints métier

Chaque entité expose une API REST standard :

| Méthode | URL                    | Description              |
|---------|------------------------|---------------------------|
| GET     | `/api/patients`        | Liste des patients (avec leurs assurances) |
| GET     | `/api/patients/{id}`   | Détail d'un patient |
| POST    | `/api/patients`        | Création (`assurances` : liste d'objets `{assuranceId, numeroMatricule}` — le numéro matricule de l'assuré est saisi pour chaque assurance choisie) |
| PUT     | `/api/patients/{id}`   | Modification |
| DELETE  | `/api/patients/{id}`   | Suppression |
| GET     | `/api/assurances`      | Liste des assurances (avec leurs garants et le nombre de patients affiliés) |
| GET     | `/api/assurances/{id}` | Détail d'une assurance |
| POST    | `/api/assurances`      | Création (`garantIds` : liste d'ids de garants existants à associer) |
| PUT     | `/api/assurances/{id}` | Modification |
| DELETE  | `/api/assurances/{id}` | Suppression |
| GET     | `/api/garants`         | Liste des garants |
| GET     | `/api/garants/{id}`    | Détail d'un garant |
| POST    | `/api/garants`         | Création |
| PUT     | `/api/garants/{id}`    | Modification |
| DELETE  | `/api/garants/{id}`    | Suppression |

Les erreurs de validation (`@Valid`) renvoient un code `400` avec le détail
des champs invalides, et une ressource introuvable renvoie un code `404`
(voir `common/GlobalExceptionHandler.java`).

### 4.6 Lancer le backend

```bash
cd backend
mvn spring-boot:run
```

L'API démarre sur `http://localhost:8080`.

## 5. Frontend React

### 5.1 Thème visuel

Le thème violet / blanc est centralisé dans `src/styles/theme.css` via des
variables CSS (`--violet-600`, `--violet-700`, `--white`, etc.), réutilisées
dans tous les composants pour garantir la cohérence visuelle.

La page d'accueil (`MainMenu.jsx`) affiche un dégradé doux violet/blanc avec
un motif discret évoquant un rythme cardiaque, pour une ambiance "santé"
professionnelle et apaisante.

### 5.2 Menu principal (bouton hamburger)

- **`TopBar`** : barre supérieure fixe contenant le bouton **Menu**
  (icône hamburger) qui ouvre/ferme le menu principal, le nom de
  l'application, et un indicateur d'état de connexion au serveur.
- **`Sidebar`** : menu principal coulissant (hors écran par défaut), en
  violet, listant les modules de la clinique :
  Tableau de bord, Patients, Assurances, Rendez-vous, Médecins, Personnel,
  Facturation, Pharmacie, Paramètres.
  Un clic sur le bouton **Menu** ou sur l'arrière-plan sombre referme
  le menu.
- **Patients** et **Assurances** ouvrent désormais de vraies pages
  connectées à l'API (`App.jsx` route selon l'élément sélectionné).
  Les autres modules affichent encore un bandeau
  **"Module en cours de développement"**.

### 5.2bis Module Patients

`pages/Patients.jsx` affiche la liste des patients dans un tableau
(nom, prénom, date de naissance, téléphone, quartier, profession,
badges des assurances associées avec leur numéro matricule) avec
actions Modifier / Supprimer.
Le bouton **Nouveau patient** ouvre `PatientForm` dans une boîte de
dialogue (`Modal`) : saisie des informations du patient et sélection,
via cases à cocher, des assurances existantes à lui associer
(relation plusieurs-à-plusieurs). **Dès qu'une assurance est cochée,
un champ « Numéro matricule de l'assuré » apparaît** pour saisir le
matricule du patient chez cette assurance — chaque assurance associée
a son propre numéro matricule.

### 5.2ter Module Assurances

`pages/Assurances.jsx` affiche la liste des assurances (libellé, NCC,
téléphone, email, nombre de patients affiliés, badges des garants) et,
en dessous, la liste de **tous les garants** enregistrés. Le bouton
**Nouvelle assurance** ouvre `AssuranceForm` : informations générales,
grille tarifaire complète (consultations généraliste/spécialiste, coûts
B/Z/K, tarifs des chambres triple/double/individuelle/VIP/VVIP), et
gestion des garants directement intégrée au formulaire — on peut cocher
des garants existants ou en créer un nouveau à la volée (mini-formulaire
libellé/téléphone/email) sans quitter la fenêtre.

### 5.3 Variables d'environnement

Fichier `frontend/.env` :

```
VITE_API_BASE_URL=http://localhost:8080
```

Utilisée par `App.jsx` pour appeler `GET /api/health` au chargement de
la page et afficher l'état du serveur dans la barre supérieure.

### 5.4 Lancer le frontend

```bash
cd frontend
npm install
npm run dev
```

L'application démarre sur `http://localhost:5173`.

## 6. Base de données MySQL

| Paramètre  | Valeur        |
|------------|---------------|
| Hôte       | `localhost:3306` |
| Utilisateur| `root`        |
| Mot de passe | `frawen25@` |
| Base       | `alphamedpro` |

Tables actuellement créées par Hibernate : `patients`, `assurances`,
`garants`, `patient_assurance` (jointure patient ↔ assurance),
`assurance_garant` (jointure assurance ↔ garant). Les autres tables
métier seront ajoutées au fur et à mesure des prochaines itérations.

## 7. Prochaines étapes (hors périmètre de cette itération)

- Authentification / gestion des rôles (médecin, secrétaire, administrateur).
- Modules métier restants : Rendez-vous, Médecins, Personnel,
  Facturation, Pharmacie.
- Connexion des cartes du menu principal aux vraies pages/routes de
  chaque module restant.
- Tests automatisés (backend : JUnit ; frontend : Vitest/RTL).
- Dockerisation (backend, frontend, MySQL) pour faciliter le déploiement.
