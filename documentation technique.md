# Documentation technique — AlphaMedPro

## 1. Présentation

**AlphaMedPro** est une application moderne et intégrée de gestion de clinique médicale et hospitalière.
Elle a pour vocation de centraliser et d'optimiser l'ensemble des flux opérationnels, cliniques et administratifs : gestion des dossiers patients, affiliations d'assurances et garants, prises en charge, catalogue et tarification des actes médicaux (laboratoire, radiologie, consultations, chirurgie), gestion des rendez-vous, suivi du personnel, facturation et pharmacie.

L'architecture s'appuie sur une séparation nette entre une API backend RESTful propulsée par Spring Boot 3 et une interface utilisateur réactive développée en React 19.

## 2. Stack technique

| Couche       | Technologie                                                     |
|--------------|-----------------------------------------------------------------|
| Backend      | Java 21, Spring Boot 3.3.4 (Web, Data JPA, Validation, Lombok) |
| Frontend     | React 19, Vite, react-router-dom, react-icons                  |
| Base de données | MySQL 8 (base `alphamedpro`)                                 |
| Build & Outils | Maven (backend), npm (frontend)                              |

## 3. Structure du dépôt

```
AlphaMedPro/
├── backend/                     # API Spring Boot
│   ├── pom.xml
│   └── src/main/java/com/alphamedpro/backend/
│       ├── AlphaMedProApplication.java   # point d'entrée
│       ├── HealthController.java         # endpoint GET /api/health
│       ├── config/CorsConfig.java        # configuration CORS (accès frontend)
│       ├── common/                       # ResourceNotFoundException, DuplicateResourceException, GlobalExceptionHandler, ApiError
│       ├── patient/                      # Patient (entité, repository, service, controller, dto/)
│       ├── assurance/                    # Assurance (entité, repository, service, controller, dto/)
│       ├── garant/                       # Garant (entité, repository, service, controller, dto/)
│       ├── patientassurance/             # PatientAssurance (entité de jointure avec matricule)
│       ├── priseencharge/                # PriseEnCharge (entité, repository, service, controller, dto/)
│       ├── medecin/                      # Medecin (entité, repository, service, controller, dto/)
│       └── acte/                         # Acte, ActType, Service (entités, repositories, services, controllers, dto/)
│   └── src/main/resources/application.properties
│
├── frontend/                    # Application React
│   └── src/
│       ├── api/                      # http.js (client fetch) + patientsApi, assurancesApi, garantsApi, priseEnChargeApi, actesApi, actTypesApi, servicesApi, medecinsApi
│       ├── components/
│       │   ├── TopBar.jsx / .css     # barre supérieure avec indicateur radar de connexion serveur
│       │   ├── Sidebar.jsx / .css    # menu latéral catégorisé (Général, Soins, Gestion, Système)
│       │   ├── Modal.jsx / .css      # boîte de dialogue modale réutilisable
│       │   ├── PageHeader.jsx / .css # en-tête standardisé de page
│       │   ├── PatientForm.jsx       # formulaire patient (+ sélection assurances & matricules)
│       │   ├── AssuranceForm.jsx     # formulaire assurance (tarifs + garants inline)
│       │   ├── MedecinForm.jsx       # formulaire médecin (Interne/Externe, spécialités, centre de santé)
│       │   └── PriseEnChargeForm.jsx # liste + formulaire des prises en charge d'un patient
│       ├── pages/
│       │   ├── MainMenu.jsx / .css   # tableau de bord d'accueil avec recherche instantanée
│       │   ├── Patients.jsx / .css   # répertoire enrichi des dossiers patients
│       │   ├── Assurances.jsx / .css # grilles tarifaires assurances et garants
│       │   ├── GestionActes.jsx /.css# catalogue des actes (Labo, Radio, Clinique, Types)
│       │   ├── ServicesPage.jsx      # gestion des services hospitaliers
│       │   └── MedecinsPage.jsx /.css# répertoire du corps médical & prescripteurs
│       ├── styles/                   # theme.css, table.css, form.css
│       └── App.jsx                   # routage applicatif & contrôle de connectivité
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

- La base `alphamedpro` est créée automatiquement si elle n'existe pas (`createDatabaseIfNotExist=true`).
- `spring.jpa.hibernate.ddl-auto=update` assure la création et mise à jour automatique des tables à partir des entités JPA.

### 4.2 Endpoints techniques

| Méthode | URL             | Description                          |
|---------|-----------------|---------------------------------------|
| GET     | `/api/health`   | Vérifie l'état de fonctionnement du backend (utilisé par le radar TopBar) |

### 4.3 CORS

`CorsConfig.java` autorise les requêtes HTTP depuis `http://localhost:5173` (Vite) vers l'ensemble des routes `/api/**` avec support des méthodes `GET`, `POST`, `PUT`, `DELETE` et `OPTIONS`.

### 4.4 Modèle de données & Entités JPA

| Entité | Table | Champs principaux | Relations |
|--------|-------|-------------------|-----------|
| **Patient** | `patients` | nom, prénom, dateNaissance, numeroTelephone, quartier, profession, code | `PatientAssurance` (plusieurs-à-plusieurs personnalisée avec Assurance), `PriseEnCharge` (1-à-N), `DossierPatient` (1-à-1) |
| **DossierPatient** | `dossiers_patients` | numeroDossier (`DP-0000001`+), dateCreation, dateDerniereModification, groupeSanguin, rhesus, poids, taille, tensionArterielle, observationsGenerales | `@OneToOne` Patient (obligatoire), `@OneToMany` AntecedentPatient (1-à-N) |
| **AntecedentPatient** | `antecedents_patients` | groupe (`ALLERGIES`, `MEDICAUX`, `CHIRURGICAUX`, `GYNECO_OBSTETRIQUES`, `VACCINATIONS`, `FAMILIAUX`, `HABITUDES_VIE`), libelle, actif (initialisé à `false` / Non par défaut), details, annee, ordre | `@ManyToOne` DossierPatient |
| **Assurance** | `assurances` | libelle, ncc, numeroTelephone, email, prixConsultationGeneraliste, prixConsultationSpecialiste, coutB, coutZ, coutK, prixChambreTriple, prixChambreDouble, prixChambreIndividuelleSimple, prixChambreVip, prixChambreVvip | `PatientAssurance` (1-à-N), `Garant` (N-à-N via `assurance_garant`) |
| **Garant** | `garants` | libelle, numeroTelephone, email | `Assurance` (N-à-N via `assurance_garant`) |
| **PatientAssurance** | `patient_assurance` | numeroMatricule (identifiant d'assuré propre au patient chez cette assurance) | `@ManyToOne` Patient, `@ManyToOne` Assurance, `@ManyToOne` Garant (organisme garant rattaché à l'assurance) |
| **PriseEnCharge** | `prises_en_charge` | dateDemande (date & heure complète), motif, montant, typeCouverture (`POURCENTAGE`, `FORFAIT`), tauxCouverture, montantForfait, montantTotal, partAssurance, partPatient, detailsActes, statut (`EN_ATTENTE`, `ACCEPTEE`, `REFUSEE`), observation | `@ManyToOne` Patient (obligatoire), `@ManyToOne` Assurance (optionnel) |
| **Visite** | `visites` | numeroVisite (`V26-0000001`+, numérotation séquentielle par année), dateVisite (date & heure complète), dateCreation (date & heure) | `@ManyToOne` Patient (obligatoire), `@OneToOne` PriseEnCharge, `@OneToMany` SousFacture |
| **SousFacture** | `sous_factures` | numeroSousFacture (`CO26-00000001`+), codeCategorie (`CO`, `EB`, `RA`, `SC`, `EC`, `PR`, `AU`), libelleCategorie, montantBrut, partAssurance, partPatient, remise, montantPaye, statutPaiement (`NON_PAYE`, `PARTIELLEMENT_PAYE`, `PAYE`), dateCreation (date & heure) | `@ManyToOne` Visite, `@ManyToOne` Patient, `@ManyToOne` Assurance, `@ManyToOne` Garant, `@ManyToOne` Medecin, `@OneToMany` SousFactureDetail |
| **SousFactureDetail** | `sous_facture_details` | libelleActe, category, prixUnitaire, quantite, montantBrut, partAssurance, partPatient, tauxCouverture, typeCouverture, montantForfait, coefficientInfo, tarifFormula | `@ManyToOne` SousFacture, `@ManyToOne` Acte, `@ManyToOne` Medecin |
| **Versement** | `versements` | numeroVersement (`REC26-0000001`+, numérotation séquentielle par année), dateVersement (date & heure), montantTotal, remise, montantVerse, monnaieRendue, resteAPayer, modePaiement (`ESPECES`, `WAVE`, `ORANGE_MONEY`, `MTN_MOMO`, `MOOV_MONEY`, `CARTE_BANCAIRE`, `CHEQUE`, `VIREMENT`), referencePaiement, caissier, observations | `@ManyToOne` Visite, `@ManyToOne` Patient, `@OneToMany` VersementLigne |
| **VersementLigne** | `versement_lignes` | montantImpute, remiseImputee | `@ManyToOne` Versement, `@ManyToOne` SousFacture |
| **Medecin** | `medecins` | nom, prénom, titre (`Dr.`, `Pr.`), spécialité, typeMedecin (`INTERNE`, `EXTERNE`), numeroTelephone, email, centreDeSante (facultatif pour les externes), code/matricule, adresse, actif | Praticiens hospitaliers internes & prescripteurs externes |
| **ActType** | `act_types` | code, libelle | `@OneToMany` Acte |
| **Acte** | `actes` | libelle, prixFixe, coefficientB, unitePrincipale, uniteSecondaire, typeAnalyse, referenceHommeAdulte, referenceFemmeAdulte, referenceEnfant, referenceNourrisson, numeroOrdre, coefficientZ, coefficientK, typeConsultation | `@ManyToOne` ActType (obligatoire) |
| **Service** | `services` | libelle | Services hospitaliers / cliniques |

### 4.5 Endpoints métier de l'API REST

#### Patients, Dossiers Patients & Prises en charge
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/patients` | Liste des patients avec leurs affiliations d'assurance et N° de dossier (`DP-0000001`) |
| GET | `/api/patients/{id}` | Détail complet d'un patient |
| POST | `/api/patients` | Création d'un patient avec création automatique immédiate de son dossier patient et initialisation des antécédents à 'Non' |
| PUT | `/api/patients/{id}` | Modification des données d'un patient et de ses assurances |
| DELETE | `/api/patients/{id}` | Suppression d'un patient |
| GET | `/api/patients/{patientId}/dossier` | Consultation du dossier patient et de ses antécédents rangés par groupe |
| PUT | `/api/patients/{patientId}/dossier` | Mise à jour du dossier patient (constantes, groupe sanguin, antécédents, observations) par le médecin |
| POST | `/api/patients/{patientId}/dossier/antecedents` | Ajout d'un antécédent médical personnalisé au dossier |
| PUT | `/api/dossiers/antecedents/{antecedentId}` | Mise à jour ciblée d'un antécédent |
| DELETE | `/api/dossiers/antecedents/{antecedentId}` | Suppression d'un antécédent personnalisé |
| POST | `/api/dossiers/associer-existants` | Association automatique de dossiers patients numérotés (`DP-0000001`+) pour tous les patients existants |
| GET | `/api/patients/{patientId}/prises-en-charge` | Liste des prises en charge associées à un patient |
| POST | `/api/patients/{patientId}/prises-en-charge` | Création d'une prise en charge pour un patient |
| POST | `/api/patients/{patientId}/visites` | Création automatique d'une Visite numérotée (`V26-0000001`) avec ses Sous-Factures (`CO26-00000001`, etc.) et détails d'actes lors de l'enregistrement |
| GET | `/api/patients/{patientId}/visites` | Liste de toutes les visites d'un patient avec leurs sous-factures |
| GET | `/api/visites` | Liste de toutes les visites pour la caisse avec filtres optionnels (`search`, `statut`, `date`) |
| GET | `/api/visites/{visiteId}` | Détail d'une visite avec ses sous-factures et lignes d'actes |
| PUT | `/api/visites/{visiteId}` | Modification complète d'une visite et de ses sous-factures / détails si aucun versement n'a encore été effectué |
| GET | `/api/prises-en-charge/{priseEnChargeId}/visite` | Récupération de la visite liée à une prise en charge |
| GET | `/api/sous-factures/{sousFactureId}` | Détail d'une sous-facture avec ses actes et son praticien/prescripteur |
| PUT | `/api/sous-factures/{sousFactureId}` | Modification d'une sous-facture (praticien, actes, quantités, tarifs) si aucun versement n'a encore été effectué |
| DELETE | `/api/sous-factures/{sousFactureId}` | Suppression d'une sous-facture si aucun versement n'a été effectué |
| GET | `/api/patients/{patientId}/sous-factures` | Liste de toutes les sous-factures d'un patient |
| POST | `/api/visites/{visiteId}/versements` | Enregistrement d'un versement (tranche, paiement total, remise, sélection de sous-factures) avec génération du reçu `REC26-0000001`+ |
| GET | `/api/visites/{visiteId}/versements` | Historique des versements d'une visite |
| GET | `/api/versements/{versementId}` | Détail complet d'un versement pour impression du reçu officiel |
| GET | `/api/versements` | Journal global de tous les versements de caisse |
| GET | `/api/patients/{patientId}/versements` | Liste des versements d'un patient |
| PUT | `/api/prises-en-charge/{id}` | Modification d'une prise en charge |
| DELETE | `/api/prises-en-charge/{id}` | Suppression d'une prise en charge |

#### Assurances & Garants
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/assurances` | Liste des assurances avec garants et nombre de patients affiliés |
| GET | `/api/assurances/{id}` | Détail d'une assurance et de sa grille tarifaire |
| POST | `/api/assurances` | Création d'une assurance avec association des garants |
| PUT | `/api/assurances/{id}` | Modification d'une assurance et de ses tarifs |
| DELETE | `/api/assurances/{id}` | Suppression d'une assurance |
| GET | `/api/garants` | Liste complète des garants |
| GET | `/api/garants/{id}` | Détail d'un garant |
| POST | `/api/garants` | Création d'un nouveau garant |
| PUT | `/api/garants/{id}` | Modification d'un garant |
| DELETE | `/api/garants/{id}` | Suppression d'un garant |

#### Actes médicaux, Types d'actes & Services
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/actes` | Liste complète de tous les actes médicaux |
| GET | `/api/actes/{id}` | Détail d'un acte médical |
| POST | `/api/actes` | Création d'un acte (Laboratoire, Radiologie, Clinique) |
| PUT | `/api/actes/{id}` | Modification d'un acte médical |
| DELETE | `/api/actes/{id}` | Suppression d'un acte médical |
| GET | `/api/act-types` | Liste des types et catégories d'actes |
| GET | `/api/act-types/{id}` | Détail d'un type d'acte |
| POST | `/api/act-types` | Création d'un type d'acte (code, libellé) |
| PUT | `/api/act-types/{id}` | Modification d'un type d'acte |
| DELETE | `/api/act-types/{id}` | Suppression d'un type d'acte |
| GET | `/api/services` | Liste des services hospitaliers |
| GET | `/api/services/{id}` | Détail d'un service |
| POST | `/api/services` | Création d'un service |
| PUT | `/api/services/{id}` | Modification d'un service |
| DELETE | `/api/services/{id}` | Suppression d'un service |

#### Médecins & Praticiens
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/medecins` | Liste complète des médecins avec filtrage par recherche (`search`) et statut (`typeMedecin`) |
| GET | `/api/medecins/{id}` | Détail complet d'un médecin / praticien |
| POST | `/api/medecins` | Création d'une fiche médecin (Nom, prénom, titre, spécialité, Interne/Externe, contacts, centre de santé) |
| PUT | `/api/medecins/{id}` | Modification de la fiche d'un médecin |
| DELETE | `/api/medecins/{id}` | Suppression d'une fiche médecin |

### 4.6 Lancement du backend

```bash
cd backend
mvn spring-boot:run
```
L'API REST est accessible sur `http://localhost:8080`.

---

## 5. Frontend React

### 5.1 Thème visuel et Design System

- **Palette chromatique** : Design médical premium articulé autour de teintes violettes profondes (`--violet-900` à `--violet-500`), d'accents lumineux et de fonds clairs texturés.
- **Micro-interactions & Ergonomie** : Cartes interactives 3D, badges de statut contextuels, effet glassmorphism (translucidité avec filtre de flou), barres de défilement stylisées et en-têtes de tableaux fixes (`sticky`).
- **Gestion du défilement & Formatage temporel** : Défilement vertical fluide (`overflow-y: auto`, hauteur maximale calibrée à `60vh` / `70vh`) et défilement horizontal adaptatif (`overflow-x: auto`). Formatage unifié des dates et heures précises (`JJ/MM/AAAA à HH:mm`) sur tous les écrans, tableaux, reçus de caisse, bons de prise en charge et fiches médicales via l'utilitaire `dateUtils.js`. Elimination stricte de tout scintillement ou débordement intempestif au survol.

### 5.2 Navigation et Menus

- **TopBar (`TopBar.jsx`)** : Barre supérieure fixe avec effet glassmorphism, logo avec redirection rapide vers le tableau de bord, bouton menu déclencheur et indicateur de connectivité API en temps réel (radar pulsé animé vert/rouge).
- **Sidebar (`Sidebar.jsx`)** : Tiroir de navigation latéral coulissant organisé par sections fonctionnelles :
  - *Général* : Tableau de bord
  - *Soins & Médical* : Patients, Actes Médicaux, Rendez-vous, Médecins, Personnel
  - *Gestion & Logistique* : Assurances & Garants, Facturation, Pharmacie
  - *Système* : Services, Paramètres
  - Badges d'état dynamiques (`Actif` pour les modules connectés, `Bientôt` pour les modules en cours).
- **MainMenu / Tableau de bord (`MainMenu.jsx`)** : Page d'accueil moderne comprenant une bannière d'accueil, des statistiques opérationnelles, une barre de recherche instantanée de modules avec filtre par catégorie (Tous, Médical, Gestion, Système) et des cartes interactives.

### 5.3 Modules Métier

#### 5.3.1 Module Patients & Dossier Médical (`pages/Patients.jsx`)
- **Répertoire Patients & Dossiers Médicaux** : Affichage sous forme de tableau riche, fluide et 100% responsive avec avatars d'initiales, pilule de code patient (`CARD-XXX`), pilule interactive de numéro de dossier patient formaté (`DP-0000001`+ ouvrant directement la modale du dossier et des antécédents au clic), coordonnées, profession, et badges individuels d'assurance incluant le matricule de l'assuré.
- **Accès Rapide « Liste des visites » (`ListeVisitesModal.jsx`)** : Bouton d'action dédié situé dans l'en-tête du répertoire des patients, à côté du bouton « Nouveau patient », ouvrant une modale grand format (`xl`) avec recherche multicritère, filtrage par date et par statut de paiement (Toutes, Non soldées, Acomptes, Soldées), synthèse statistique financière et vue détaillée dépliable des visites, sous-factures et actes médicaux :
  - *Affichage du Nombre de Sous-Factures Non Soldées* : Le badge de statut indique avec précision le nombre de sous-factures non soldées au sein de chaque visite (`X sous-facture(s) non soldée(s)` ou `Toutes soldées`) au lieu d'un libellé générique.
  - *Modification Complète de la Visite via la Fiche Nouvelle Visite* : Bouton « Modifier la visite » présent sur chaque carte de visite dans `ListeVisitesModal` et `VisitesPatientModal`. Le clic ouvre directement la fiche « Nouvelle Visite » (`PriseEnChargePage.jsx`) en pré-chargeant automatiquement toutes les informations du patient, l'assurance associée, les praticiens désignés (restaurés fidèlement dans chaque sélecteur de sous-total), ainsi que l'ensemble des sous-factures et leurs actes médicaux dans le panier des actes avec recalcul en temps réel. Le bouton de retour bascule dynamiquement en « Retour à la liste des visites » pour un parcours utilisateur fluide.
  - *Suppression Sécurisée des Sous-Factures* : Possibilité de supprimer individuellement toute sous-facture n'ayant pas encore fait l'objet d'un versement depuis la liste des visites ou de modifier l'intégralité de la visite dans la fiche dédiée. Les visites et sous-factures ayant déjà reçu un versement ou acompte sont automatiquement verrouillées pour préserver l'intégrité comptable.
- **Création Automatique du Dossier Patient** : À chaque enregistrement d'un nouveau patient, un `DossierPatient` unique est généré instantanément avec un numéro incrémental formel (`DP-0000001`, `DP-0000002`...).
- **Initialisation des Antécédents par Défaut à « Non »** : Tous les antécédents médicaux de référence sont pré-chargés et positionnés par défaut à l'état inactif (`Non` / `false`), permettant une saisie rapide et ciblée lors des consultations.
- **Organisation Structurée des Antécédents par Groupes** :
  - *Allergies* : Médicamenteuses (pénicilline, AINS...), alimentaires, respiratoires, cutanées & contact.
  - *Antécédents Médicaux* : HTA, Diabète (Type 1 / 2), Asthme / BPCO, Cardiopathies, AVC, Insuffisance rénale, Drépanocytose, Ulcère, Épilepsie, Hépatites, Cancers, VIH...
  - *Antécédents Chirurgicaux* : Appendicectomie, Césarienne antérieure, Cure de hernie, Laparotomie, Chirurgie orthopédique, Gynécologique, ORL...
  - *Gynéco-Obstétriques* : Gestité / Parité, Avortements / Fausses couches, Césariennes, Contraception, Cycles, Grossesse en cours...
  - *Vaccinations* : BCG, DTP, Hépatite B, Fièvre Jaune, Covid-19, ROR, Méningite, Typhoïde...
  - *Antécédents Familiaux* : HTA familiale, Diabète, Cancers, Drépanocytose, Cardiopathies précoces...
  - *Habitudes de Vie & Facteurs de Risque* : Tabagisme, Alcool, Toxiques, Sédentarité, Régimes...
- **Interface de Consultation & Mise à Jour par le Médecin (`DossierPatientModal.jsx`)** :
  - *Organisation Modulaire en Cartes Médicales 3D* : Présentation claire et aérée des antécédents par groupe thématique sous forme de cartes modulaires (`.dossier-group-card`), avec en-têtes illustrés, badges dynamiques de décompte et barre de filtrage rapide (Vue complète ou par groupe clinique).
  - *Cases à cocher interactives avec surbrillance verte* : Chaque élément dispose d'une case à cocher personnalisée. Dès qu'un antécédent est coché (`OUI`), l'élément s'illumine en vert émeraude (`#f0fdf4` / `#10b981`) et déploie instantanément le panneau de saisie pour renseigner les détails cliniques (réactions, précisions, traitements) et l'année.
  - *Constantes Médicales & Profil* : Groupe sanguin (A, B, AB, O) et Rhésus (+/-), Tension artérielle, Poids, Taille et calcul automatique dynamique de l'IMC avec statut coloré (Normal, Surpoids, Obésité).
  - *Ajout d'Antécédents Personnalisés dans chaque Carte* : Formulaire direct au bas de chaque carte permettant au médecin d'ajouter à la volée un élément spécifique.
  - *Observations Cliniques & Impression* : Bloc de notes libres pour le praticien et bouton d'impression/export de la fiche médicale.
- **Rattrapage Automatique des Patients Existants** : Au démarrage du backend (`DossierPatientInitializer`), un dossier patient avec son numéro `DP-XXXXXXX` et ses antécédents à « Non » est automatiquement créé et associé à chaque patient existant n'en possédant pas encore.
- **Barre d'outils** : Recherche instantanée multicritère (nom, prénom, téléphone, quartier, profession, code) avec bouton de réinitialisation rapide et compteur dynamique d'enregistrements.
- **Création & Édition (`PatientForm.jsx`)** : Formulaire modal avec sélection d'assurances et garants associés à la volée. Dès qu'une assurance est sélectionnée, le système déploie automatiquement le sélecteur des **garants rattachés à cette assurance** ainsi que le champ de saisie du **numéro matricule spécifique** de l'assuré.
- **Nouvelle Visite / Prises en charge (`pages/PriseEnChargePage.jsx`)** : Accessible directement depuis le bouton « Nouvelle visite » du répertoire des patients. Page dédiée complète pour l'émission, la saisie des actes et le calcul de prise en charge (mise en page occupant désormais l'intégralité de la largeur de l'écran, sans limitation à 1440px héritée des autres pages de gestion, avec typographie claire, cartes compactes et généreuses, grand panier d'actes et synthèse financière complète) :
  - *Disposition supérieure côte à côte (`.pec-top-sections-row`)* : Regroupement sur une même ligne en grille responsive de la fiche d'information patient / sélection d'assurance (colonne gauche, habillée en bleu ciel pâle) et du paramétrage du type de couverture (colonne droite, habillée en **rose clair pâle**), avec typographies, contrôles et cartes profilés pour un gain d'espace vertical maximal.
  - *Fiche patient & Sélection d'assurance* : Mention formelle « DOIT : », identité du patient (Nom, prénom, âge, contacts, code carte) et sélection ergonomique de l'assurance dans une section habillée d'un dégradé **bleu ciel pâle** (`#f0f9ff` vers `#e0f2fe`) avec bordure assortie (`#bae6fd`), avatar soigné, numéro matricule et grille tarifaire mini.
  - *Type de couverture global & individuel par acte* : Section habillée d'un dégradé **rose clair pâle** (`#fff1f2` vers `#ffe4e6`) avec bordure coordonnée (`#fecdd3`), commutateur global **Pourcentage (%)** (par défaut) ou **Forfait (FCFA)**, avec possibilité d'individualiser pour chaque acte du panier le mode de prise en charge (% ou Forfait) et d'ajuster son taux ou son montant forfaitaire spécifique.
  - *Panier à actes optimisé & Panier Actuel* : Panneau « Panier Actuel » habillé d'un fond `cornsilk` chaleureux et élégant, suppression de la colonne quantité et masquage du type de consultation pour un tableau épuré et centré sur l'acte et sa tarification, calcul en temps réel de la Part Assurance et du Reste à charge Patient.
  - *Tarification dynamique selon l'assurance* :
    - **Consultations** : Prix déterminé directement selon la grille de l'assurance sélectionnée (`prixConsultationGeneraliste` ou `prixConsultationSpecialiste`).
    - **Analyses de Laboratoire** : Calcul automatique par lettre-clé : `B × Coût du B` propre à l'assurance, avec possibilité de modifier directement le **Coût du B** dans le panier (par acte ou pour l'ensemble du groupe laboratoire).
    - **Actes de Radiologie** : Calcul automatique par lettre-clé : `Z × Coût du Z` propre à l'assurance, avec possibilité de modifier directement le **Coût du Z** dans le panier (par acte ou pour l'ensemble du groupe radiologie).
    - **Chirurgie & Autres actes** : Prise en charge des coefficients `K × Coût du K` (avec modification directe du Coût K) ou des prix fixes de référence.
    - **Recalcul instantané** : Dès que l'utilisateur sélectionne ou change d'assurance dans la fiche ou ajuste un coût unitaire (B, Z, K), tous les actes du panier et du catalogue sont automatiquement recalculés en temps réel avec affichage de la formule de tarification explicative.
  - *Sous-totaux par type d'acte, Praticiens & Catalogue intelligent* : Regroupement automatique des soins par catégorie (Laboratoire, Radiologie, Consultations, Chirurgie, Autres) avec lignes de sous-totaux dédiées dans le tableau (mises en valeur par un fond dégradé orange clair pâle doux et bordures soignées), barre récapitulative dynamique sur fond gris foncé et intégration optimisée dans un tableau de panier élargi :
    - **Sélection du Médecin consultant** : Choix direct dans la liste déroulante de sous-total des consultations parmi les praticiens enregistrés en base de données, avec bouton « + » pour créer et assigner instantanément un nouveau médecin sans quitter le panier.
    - **Sélection du Prescripteur** : Choix direct dans la liste déroulante de sous-total des analyses de laboratoire, actes de radiologie, scanner et échographie parmi les prescripteurs enregistrés, avec bouton « + » pour créer un nouveau praticien ou prescripteur externe.
    - **Traçabilité & Impression** : Mention formelle « DOIT : » du patient bénéficiaire, conservation en base de données et affichage avec blocs de signatures dédiés sur le Bon de Prise en Charge officiel.
    - **Catalogue d'actes & Gestion intégrée** : Fond vert pâle doux (`#f0fdf4` vers `#dcfce7`), filtrage par onglets fonctionnel (Tous, Laboratoire, Radiologie, Consultations, Chirurgie, Autres), bouton « Gérer les actes » permettant d'ouvrir directement le module de gestion et tarification des actes en modale grand format avec rechargement automatique du catalogue, ainsi qu'un grisement et blocage automatique avec badge « Déjà ajouté » pour tout acte déjà présent dans le panier.
  - *Synthèse Financière & Validation* : Visualisation épurée des 3 montants clés (Montant total brut des actes, Part prise en charge assurance, Part restante patient / ticket modérateur) et bouton unique « Enregistrer ». À l'enregistrement :
    - La visite (`V26-XXXXXXX`) et ses sous-factures (`CO26-XXXXXXXX`, `EB26-XXXXXXXX`, etc.) sont créées et transmises en temps réel à la caisse.
    - Le panier d'actes est immédiatement vidé et le bouton « Enregistrer » est automatiquement grisé et désactivé.
    - Un bandeau récapitulatif affiche le N° de Dossier patient (`DP-XXXXXXX`), le N° de Visite et les sous-factures générées, accompagné de deux boutons d'action rapide : « Retour à la liste des patients » et « Afficher les visites » (qui ouvre la modale complète `VisitesPatientModal` détaillant toutes les visites et sous-factures enregistrées pour ce patient).

#### 5.3.2 Module Assurances & Garants (`pages/Assurances.jsx`)
- **Assurances** : Liste complète avec libellé, NCC, coordonnées, nombre de patients affiliés et badges des garants rattachés.
- **Grille tarifaire (`AssuranceForm.jsx`)** : Configuration détaillée des tarifs de consultations (Généraliste / Spécialiste), des lettres-clés (coefficients B, Z, K) et des catégories de chambres d'hospitalisation (Triple, Double, Individuelle simple, VIP, VVIP).
- **Gestion des Garants** : Tableau des garants et création directe à la volée depuis le formulaire d'assurance sans interruption de saisie.

#### 5.3.3 Module Gestion des Actes Médicaux (`pages/GestionActes.jsx`)
Organisation modulaire structurée en tableaux distincts adaptés aux spécificités de chaque famille d'actes :
- **Tableau Laboratoire / Analyses Médicales** : Affichage optimisé avec N° d'ordre/position, libellé de l'analyse, type d'analyse (Simple / Composé), coefficient B, unités principale et secondaire, valeurs de référence par tranche (Homme adulte, Femme adulte, Enfant, Nourrisson), tarification et actions.
- **Tableau Radiologie** : Affichage des examens radiologiques avec leur coefficient Z et tarification.
- **Tableau Autres Actes Cliniques** : Consultations, chirurgie (coeff. K), soins infirmiers, échographie, scanner avec filtrage contextuel par catégorie.
- **Tableau de configuration des Types d'actes** : Dictionnaire d'administration des codes et libellés de types d'actes.
- **Navigation par onglets** : Sélecteur rapide avec compteurs dynamiques en temps réel (Tous, Laboratoire, Radiologie, Autres actes, Types d'actes).
- **Isolation stricte à la création/édition** : Le formulaire modal filtre dynamiquement les types d'actes disponibles selon le contexte d'ouverture (les types Laboratoire et Radiologie n'apparaissent pas dans la création des Autres actes et réciproquement).

#### 5.3.4 Module Services Hospitaliers (`pages/ServicesPage.jsx`)
- Gestion du référentiel des services de l'établissement (Médecine générale, Chirurgie, Pédiatrie, Maternité, Urgences, etc.).

#### 5.3.5 Module Médecins & Praticiens (`pages/MedecinsPage.jsx`)
- **Fiches Praticiens & Prescripteurs** : Gestion intégrale du corps médical avec nom, prénom, civilités étendues (`Dr.`, `Pr.`, `IDE`, `SAGE / MAÏEUTICIEN`, `M.`, `Mme`), spécialité médicale, coordonnées téléphoniques et email, et code/matricule d'ordre.
- **Distinction Praticien Interne / Praticien Externe & Établissement** :
  - *Praticien Interne* : Praticien exerçant au sein de l'établissement (badge vert émeraude, pastille statut lumineuse), identifié comme `Interne` (champ de saisie d'établissement masqué dans le formulaire).
  - *Praticien Externe* : Praticien partenaire ou prescripteur externe (badge bleu ciel), avec champ de saisie dédié pour renseigner son établissement / centre de santé de provenance (facultatif) (ex : CHU, polyclinique, cabinet médical privé).
- **Formulaire Praticien Moderne & Structuré (`MedecinForm.jsx`)** :
  - *Organisation modulaire en cartes 3D spacieuses* : Découpage clair en 4 modules aérés (1. Statut & Type de Praticien, 2. Identité & Civilité, 3. Discipline & Spécialité Médicale, 4. Coordonnées de Contact & Localisation).
  - *Saisie de l'Établissement réservée aux Praticiens Externes* : Le champ de saisie « Établissement » est masqué pour les praticiens internes et affiché uniquement pour les praticiens externes (facultatif).
  - *Sélecteur de type épuré* : Cartes de statut à 2 colonnes bien distinctes avec icônes grand format, titres clairs (« Praticien Interne » et « Praticien Externe ») sans mention en dur, descriptions explicatives et badge de sélection dynamique (`✓ Sélectionné`).
  - *Civilités médicales et soignantes* : Support complet pour les médecins (`Dr.`, `Pr.`), infirmiers (`IDE`) et sages-femmes / maïeuticiens (`SAGE / MAÏEUTICIEN`).
  - *Modale grand format* : Affichage en `size="large"` (820px) pour une ergonomie de saisie aérée et fluide.
- **Design harmonisé avec la charte GestionActes** :
  - *En-tête de page standardisé* : Bouton d'action principal « Ajouter un médecin » intégré directement dans le `PageHeader` supérieur pour une ergonomie unifiée.
  - *Architecture de section* : Sections `.management-section` avec `border-radius: 14px`, `border: 1px solid var(--violet-200)` et `box-shadow` violet, identiques au module de gestion des actes médicaux.
  - *En-têtes de section* : Bandeau `.section-title-row` sur fond `var(--violet-50)` avec icône, titre H2, sous-titre et pilule compteur, séparé par `border-bottom: 1px solid var(--violet-100)`.
  - *Toolbar violet* : Barre de recherche et filtres sur fond `#faf5ff` avec bordure violette inférieure, intégrée dans le flux de la section.
  - *Onglets de filtre* : Onglets Tous / Praticiens Internes / Praticiens Externes stylisés `.type-filter-tabs` / `.type-tab` identiques aux `.act-category-tabs` violets avec état actif `background: var(--violet-700)`.
  - *Puces de spécialités* : Barre de filtrage rapide `.specialites-quick-bar` intégrée dans la section sur fond `#faf5ff`, puces style `.act-type-chip` (bordure `--violet-200`, actif violet solide).
  - *En-têtes de tableau sticky* : Fond `var(--violet-50)`, couleur `--violet-800`, bordure inférieure `--violet-100`, position sticky pour navigation fluide.
  - *État vide soigné* : Rendu élégant au sein du tableau lorsqu'aucun résultat n'est trouvé, avec icône `FaUserMd` pulsée sur halo violet, titre « Aucun médecin trouvé », message explicatif contextuel et bouton de réinitialisation des filtres.
- **Cartes KPI 3D avec halos lumineux** : Total praticiens (avec %), praticiens internes et externes (avec badges de pourcentage colorés) et disciplines médicales représentées.
- **Double mode d'affichage interactif** :
  - *Vue Tableau* : Tableau riche et fluide avec avatars d'initiales colorés, pastilles de statut lumineuses, badges de spécialités violets, liens téléphoniques directs et actions rapides.
  - *Vue Cartes / Trombinoscope* : Grille de cartes de profil 3D avec grand avatar cerclé, bandeau de spécialité, coordonnées cliquables et boutons d'accès direct.
- **Fiche Praticien Détaillée** : Modale d'identité complète avec boutons d'appel et d'envoi d'email en un clic.
- **Intégration Prises en Charge** : Alimentation dynamique et instantanée des listes déroulantes de médecin consultant (pour les consultations), de prescripteur (pour les analyses de laboratoire, radiologie, scanners et échographies) et des praticiens généraux dans les sous-totaux du panier d'actes, avec bouton d'ajout « + » permettant d'enregistrer et de sélectionner un praticien à la volée.

#### 5.3.6 Module Caisse & Encaissements (`pages/CaissePage.jsx`)
- **Tableau de bord de Caisse en Temps Réel** : Dès qu'une prise en charge est validée et enregistrée, la visite médicale associée apparaît immédiatement à la caisse avec N° de visite séquentiel annuel (`V26-0000001`+), nom et prénom du patient, N° de dossier (`DP-0000001`+), montants (Brut, Part Assurance, Part Patient, Remise, Déjà payé, Reste dû) et statut d'encaissement dynamique.
- **Cartes KPI Financières 3D** : Visualisation instantanée des dossiers de visite, du total encaissé en caisse (FCFA), du reste à recouvrer / ticket modérateur patient et des remises accordées.
- **Filtrage Multicritère & Journal** :
  - *Onglets de statut* : Toutes les visites, En attente / Non payé (rouge), Partiellement payé (bleu), Soldé / Réglé (vert) et Journal des versements.
  - *Recherche instantanée* : Recherche par N° de visite, nom/prénom patient, N° de dossier, téléphone, matricule ou N° de reçu.
  - *Filtre par date* : Sélection de la date de visite ou de versement.
- **Modale d'Encaissement & Règlement (`CaisseEncaissementModal.jsx`)** :
  - *Sélection granulaire des sous-factures* : Possibilité pour le caissier de cocher individuellement les sous-factures que le patient souhaite régler (Consultation `CO`, Labo `EB`, Radio `RA`, Scanner `SC`, Échographie `EC`, etc.) ou de tout sélectionner en un clic.
  - *Gestion des Remises & Exonérations* : Application d'une remise commerciale ou d'indigence en montant fixe (FCFA) ou en pourcentage (%), avec motif de remise et recalcul instantané du Net à payer patient.
  - *Paiements échelonnés en plusieurs tranches* : Saisie libre du montant versé (acompte, paiement partiel ou règlement intégral). Le système calcule en temps réel le reste dû pour les tranches ultérieures ou la monnaie à rendre en cas de paiement en espèces supérieur au net.
  - *Modes de règlement multiples* : Prise en charge complète des espèces, mobile money (Wave, Orange Money, MTN MoMo, Moov Money), carte bancaire, chèque et virement avec saisie de référence de transaction.
  - *Horodatage précis & Traçabilité* : Enregistrement de la date et heure exacte du versement et de l'identité de l'agent de caisse.
  - *Historique des versements précédents* : Consultation et réimpression des reçus de toutes les tranches antérieures de la visite.
- **Reçu de Caisse Officiel Imprimable (`RecuCaisseModal.jsx`)** :
  - Génération automatique d'un numéro de reçu séquentiel annuel au format `REC{AA}-{NNNNNNN}` (ex: `REC26-0000001`).
  - Impression propre (`window.print`) du ticket de caisse officiel avec en-tête AlphaMedPro, coordonnées complètes du patient, détail des sous-factures et actes réglés, synthèse financière (Montant encaissé, Remise, Reste à payer), mode de règlement et blocs de signature / cachet.

### 5.4 Variables d'environnement frontend

Fichier `frontend/.env` :
```env
VITE_API_BASE_URL=http://localhost:8080
```

### 5.5 Lancement du frontend

```bash
cd frontend
npm install
npm run dev
```
L'application démarre sur `http://localhost:5173`.

---

## 6. Base de données MySQL

| Paramètre | Valeur |
|-----------|--------|
| Hôte | `localhost:3306` |
| Utilisateur | `root` |
| Mot de passe | `frawen25@` |
| Base de données | `alphamedpro` |

**Tables créées et gérées par Hibernate (`ddl-auto=update`) :**
1. `patients` : dossiers patients.
2. `assurances` : compagnies d'assurance et grilles tarifaires.
3. `garants` : organismes garants.
4. `patient_assurance` : table d'association patient ↔ assurance avec matricule individualisé.
5. `assurance_garant` : table d'association assurance ↔ garant.
6. `prises_en_charge` : demandes de prises en charge rattachées aux patients et assurances.
7. `medecins` : corps médical (médecins internes, praticiens consultants, prescripteurs externes & centres de santé).
8. `act_types` : types et catégories d'actes médicaux.
9. `actes` : catalogue complet des actes (Laboratoire, Radiologie, Chirurgie, Consultations, Soins).
10. `services` : services hospitaliers et cliniques.
11. `visites` : visites médicales numérotées au format `V{AA}-{NNNNNNN}` (ex: `V26-0000001`), liées à un patient et une prise en charge, avec réinitialisation de la séquence chaque nouvelle année.
12. `sous_factures` : sous-factures par type d'acte rattachées à une visite, numérotées au format `{CODE}{AA}-{NNNNNNNN}` (ex: `CO26-00000001`), liées à un patient, une assurance, un garant, un médecin/prescripteur, avec totaux financiers (brut, part assurance, part patient, remise, montant payé, statut paiement) et date de création. Codes : `CO` (Consultation), `EB` (Examens Biologiques / Labo), `RA` (Radiologie), `SC` (Scanner), `EC` (Échographie), `PR` (Prélèvement), `AU` (Autres actes).
13. `sous_facture_details` : lignes détaillées des actes médicaux composant chaque sous-facture (acte lié, libellé, prix unitaire, quantité, montant brut, part assurance, part patient, taux et type de couverture, formule de tarification, médecin/prescripteur).
14. `versements` : reçus et versements d'encaissement numérotés au format `REC{AA}-{NNNNNNN}` (ex: `REC26-0000001`), liés à une visite et un patient, avec montant versé, remise accordée, reste à payer, monnaie rendue, mode de paiement, horodatage et opérateur de caisse.
15. `versement_lignes` : ventilation et imputation précise de chaque versement et remise sur les sous-factures sélectionnées.

---

## 7. Prochaines étapes de développement

- **Authentification & Gestion des Rôles** : Sécurité Spring Security / JWT, gestion des profils (Administrateur, Médecin, Secrétaire, Infirmier, Caissier).
- **Module Rendez-vous** : Planning interactif, calendrier des consultations et gestion des créneaux.
- **Module Médecins & Personnel** : Fiches praticiens, spécialités, affectation aux services et plannings de garde.
- **Module Facturation & Encaissement** : Génération de factures, calcul automatique de la part assurance / part patient (ticket modérateur) selon les grilles tarifaires et prises en charge.
- **Module Pharmacie & Stock** : Gestion des médicaments, ordonnances, entrées/sorties et alertes de stock.
- **Tests automatisés** : Couverture de tests unitaires et d'intégration (JUnit 5, Mockito pour le backend ; Vitest, Testing Library pour le frontend).
- **Conteneurisation Docker** : Fichiers `Dockerfile` et `docker-compose.yml` (Spring Boot, React, MySQL) pour faciliter le déploiement.
