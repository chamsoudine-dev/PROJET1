# Phase 0 — Audit & Architecture Détaillée
**Projet : Santé Numérique Niger — Plateforme nationale SIS**  
**Date : 2026-11-17**  
**Auteur : Architecte Full-Stack Senior**

---

## 1. État du dépôt

- Répertoire `csi-niger2` : **vide** (aucun fichier, pas de `.git`)
- Aucun code existant à réutiliser
- Première initialisation complète

---

## 2. Choix d'architecture techniques

| Couche | Choix | Justification |
|--------|-------|---------------|
| **Frontend** | Next.js 15 (App Router) + TypeScript + Tailwind CSS | React Server Components, streaming, SEO, PWA natif via `next-pwa` |
| **Backend API** | Routes Next.js (Server Actions + Route Handlers) | Zéro serveur séparé, déployable sur Vercel/Netlify/Node standalone, colocation logique |
| **Validation** | Zod v4 (schémas partagés client/serveur) | Type-safe end-to-end, inférence TS automatique |
| **Base de données** | PostgreSQL 16+ (Supabase/Neon gratuit pour dev) | RLS natif, pgcrypto, partitioning, JSONB, extensions riches |
| **ORM / Migrations** | **Drizzle ORM** + `drizzle-kit` | SQL-first, types TS inférés, léger, migrations versionnées, compatible edge |
| **Auth** | NextAuth.js v5 (Auth.js) + credentials + 2FA (TOTP) | Standards OAuth/OIDC, adapters Drizzle, callbacks RLS-ready |
| **Stockage hors-ligne** | IndexedDB (via `idb` wrapper) + Service Worker (Workbox) | PWA installable, sync queue avec conflit résolution last-write-wins + serveur |
| **i18n** | `next-intl` (App Router ready) | Routing localisé, messages externes, ready pour haoussa/zarma |
| **Graphiques** | Recharts (SSR-friendly, light) + `lucide-react` icons | Tree-shakable, responsive, accessible |
| **PDF/Excel** | `@react-pdf/renderer` + `xlsx` (server-only) | Génération rapports côté serveur |
| **Tests** | Vitest (unit/intégration) + Playwright (E2E) | Rapide, TS natif, coverage intégré |
| **CI/CD** | GitHub Actions (lint, typecheck, test, build, deploy preview) | Standard, matrix Node, cache pnpm |
| **Gestion secrets** | `.env.local` (dev) + variables d'env plateforme (prod) | Jamais en Git, `.env.example` fourni |

---

## 3. Schéma de base de données (PostgreSQL + Drizzle)

### 3.1. Tables de référence (géographie & administration)

```sql
-- Régions (8 fixes, admin national seulement en écriture)
CREATE TABLE region (
  id            SMALLSERIAL PRIMARY KEY,
  code          CHAR(2) NOT NULL UNIQUE,        -- AG, DI, DO, MA, NI, TA, TI, ZI
  nom           VARCHAR(50) NOT NULL,
  nom_haoussa   VARCHAR(50),
  nom_zarma     VARCHAR(50),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Districts sanitaires (par région)
CREATE TABLE district (
  id            SERIAL PRIMARY KEY,
  region_id     SMALLINT NOT NULL REFERENCES region(id),
  code          VARCHAR(10) NOT NULL,
  nom           VARCHAR(100) NOT NULL,
  nom_haoussa   VARCHAR(100),
  nom_zarma     VARCHAR(100),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (region_id, code)
);

-- Formations sanitaires (CSI, hôpitaux, etc.)
CREATE TYPE type_formation AS ENUM (
  'CSI', 'CSI_CASE_SANTE', 'CSME',
  'HOPITAL_DISTRICT', 'HOPITAL_REGIONAL', 'HOPITAL_NATIONAL'
);

CREATE TABLE formation_sanitaire (
  id                    BIGSERIAL PRIMARY KEY,
  district_id           INT NOT NULL REFERENCES district(id),
  code                  VARCHAR(20) NOT NULL UNIQUE,       -- Code national unique
  nom                   VARCHAR(150) NOT NULL,
  type                  type_formation NOT NULL,
  latitude              NUMERIC(9,6),
  longitude             NUMERIC(9,6),
  telephone             VARCHAR(20),
  email                 VARCHAR(100),
  responsable_nom       VARCHAR(100),
  responsable_telephone VARCHAR(20),
  actif                 BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);
```

### 3.2. Utilisateurs, rôles, affectations

```sql
CREATE TYPE role_utilisateur AS ENUM (
  'ADMIN_NATIONAL',
  'SUPERVISEUR_NATIONAL',
  'SUPERVISEUR_REGIONAL',
  'AGENT_SANTE'
);

CREATE TABLE utilisateur (
  id                    BIGSERIAL PRIMARY KEY,
  email                 VARCHAR(150) NOT NULL UNIQUE,
  password_hash         VARCHAR(255) NOT NULL,          -- argon2id
  totp_secret           VARCHAR(32),                    -- chiffré pgcrypto
  totp_enabled          BOOLEAN DEFAULT false,
  prenom                VARCHAR(50) NOT NULL,
  nom                   VARCHAR(50) NOT NULL,
  telephone             VARCHAR(20),
  role                  role_utilisateur NOT NULL,
  region_id             SMALLINT REFERENCES region(id), -- NULL pour admin/superviseur national
  district_id           INT REFERENCES district(id),    -- NULL sauf agent/superviseur régional
  formation_sanitaire_id BIGINT REFERENCES formation_sanitaire(id), -- NULL sauf agent
  statut                VARCHAR(20) DEFAULT 'EN_ATTENTE', -- EN_ATTENTE, ACTIF, SUSPENDU, REJETE
  dernier_connexion     TIMESTAMPTZ,
  echecs_connexion      SMALLINT DEFAULT 0,
  verrouille_jusqu      TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  created_by            BIGINT REFERENCES utilisateur(id)
);

-- Index pour RLS
CREATE INDEX idx_utilisateur_formation ON utilisateur(formation_sanitaire_id);
CREATE INDEX idx_utilisateur_region ON utilisateur(region_id);
CREATE INDEX idx_utilisateur_statut ON utilisateur(statut);
```

### 3.3. Registre national des patients

```sql
-- Identifiant national unique : format SN-YYYY-NNNNNNNN (non séquentiel visible)
CREATE TABLE patient (
  id                    BIGSERIAL PRIMARY KEY,
  identifiant_national  VARCHAR(20) NOT NULL UNIQUE,    -- SN-2026-A7F3K9
  nom                   VARCHAR(100) NOT NULL,
  prenom                VARCHAR(100) NOT NULL,
  date_naissance        DATE,                           -- NULL si âge estimé
  age_estime            SMALLINT,                       -- en années si pas de date
  sexe                  CHAR(1) NOT NULL CHECK (sexe IN ('M','F')),
  village               VARCHAR(100),
  quartier              VARCHAR(100),
  personne_contact_nom  VARCHAR(100),
  personne_contact_tel  VARCHAR(20),
  telephone             VARCHAR(20),
  formation_creation_id BIGINT NOT NULL REFERENCES formation_sanitaire(id),
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  created_by            BIGINT NOT NULL REFERENCES utilisateur(id)
);

-- Index recherche approximative (trigram via pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_patient_nom_trgm ON patient USING gin (nom gin_trgm_ops);
CREATE INDEX idx_patient_prenom_trgm ON patient USING gin (prenom gin_trgm_ops);
CREATE INDEX idx_patient_dob_village ON patient (date_naissance, village);
CREATE INDEX idx_patient_identifiant ON patient (identifiant_national);

-- Fusion / doublons (audit trail)
CREATE TABLE patient_fusion (
  id                    BIGSERIAL PRIMARY KEY,
  patient_source_id     BIGINT NOT NULL REFERENCES patient(id),  -- absorbé
  patient_cible_id      BIGINT NOT NULL REFERENCES patient(id),  -- conservé
  motif                 TEXT,
  valide_par            BIGINT NOT NULL REFERENCES utilisateur(id),
  created_at            TIMESTAMPTZ DEFAULT now()
);
```

### 3.4. Consultations (partitionnée par mois)

```sql
CREATE TYPE motif_consultation AS ENUM (
  'MALADIE', 'VACCINATION', 'CPN', 'ACCOUCHEMENT', 'CPON',
  'NUTRITION', 'PLANNING_FAMILIAL', 'AUTRE'
);

CREATE TABLE consultation (
  id                      BIGSERIAL PRIMARY KEY,
  patient_id              BIGINT NOT NULL REFERENCES patient(id),
  formation_sanitaire_id  BIGINT NOT NULL REFERENCES formation_sanitaire(id),
  agent_id                BIGINT NOT NULL REFERENCES utilisateur(id),
  date_consultation       TIMESTAMPTZ NOT NULL DEFAULT now(),
  motif                   motif_consultation NOT NULL,
  cim10_code              VARCHAR(10),                    -- diagnostic principal
  cim10_libelle           VARCHAR(200),
  diagnostic_secondaire   JSONB,                          -- codes CIM-10 additionnels
  traitement              JSONB,                          -- médicaments prescrits (dci, dose, durée)
  evolution               VARCHAR(50) CHECK (evolution IN ('GUERISON','AMELIORATION','STATIONNAIRE','AGGRAVATION','DECES','REFERENCE')),
  referer_vers_id         BIGINT REFERENCES formation_sanitaire(id), -- si référence
  observations            TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
) PARTITION BY RANGE (date_consultation);

-- Partitions mensuelles (ex: 2026_01, 2026_02...)
-- Création via migration Drizzle dynamique ou script SQL
```

### 3.5. Vaccination (PEV)

```sql
CREATE TYPE type_vaccin AS ENUM (
  'BCG', 'VPO', 'PENTA', 'PNEUMO', 'ROTA', 'VAR', 'FIEVRE_JAUNE',
  'HPV', 'COVID', 'TETANOS', 'AUTRE'
);

CREATE TABLE vaccination (
  id                      BIGSERIAL PRIMARY KEY,
  patient_id              BIGINT NOT NULL REFERENCES patient(id),
  formation_sanitaire_id  BIGINT NOT NULL REFERENCES formation_sanitaire(id),
  agent_id                BIGINT NOT NULL REFERENCES utilisateur(id),
  date_vaccination        TIMESTAMPTZ NOT NULL DEFAULT now(),
  vaccin                  type_vaccin NOT NULL,
  dose_numero             SMALLINT NOT NULL,              -- 1, 2, 3...
  lot_numero              VARCHAR(50),
  date_peremption         DATE,
  site_injection          VARCHAR(50),                    -- bras gauche/droit, cuisse
  reaction                TEXT,
  created_at              TIMESTAMPTZ DEFAULT now()
) PARTITION BY RANGE (date_vaccination);

CREATE INDEX idx_vaccination_patient_date ON vaccination (patient_id, date_vaccination);
```

### 3.6. Santé maternelle & infantile

```sql
-- Consultations prénatales (CPN)
CREATE TABLE cpn (
  id                      BIGSERIAL PRIMARY KEY,
  patient_id              BIGINT NOT NULL REFERENCES patient(id),
  formation_sanitaire_id  BIGINT NOT NULL REFERENCES formation_sanitaire(id),
  agent_id                BIGINT NOT NULL REFERENCES utilisateur(id),
  date_cpn                TIMESTAMPTZ NOT NULL DEFAULT now(),
  numero_cpn              SMALLINT NOT NULL CHECK (numero_cpn BETWEEN 1 AND 8),
  age_gestationnel        SMALLINT,                       -- semaines
  taille                  NUMERIC(4,1),                   -- cm
  poids                   NUMERIC(5,2),                   -- kg
  tension_arterielle      VARCHAR(20),                    -- "120/80"
  hb                      NUMERIC(3,1),                   -- g/dL
  vih_test                BOOLEAN,
  vih_resultat            VARCHAR(20),
  palu_test               BOOLEAN,
  palu_resultat           VARCHAR(20),
  tetanos_doses           SMALLINT DEFAULT 0,
  fer_acide_folique       BOOLEAN DEFAULT false,
  mildiose                BOOLEAN DEFAULT false,
  observations            TEXT,
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- Accouchements
CREATE TABLE accouchement (
  id                      BIGSERIAL PRIMARY KEY,
  patient_id              BIGINT NOT NULL REFERENCES patient(id),
  formation_sanitaire_id  BIGINT NOT NULL REFERENCES formation_sanitaire(id),
  agent_id                BIGINT NOT NULL REFERENCES utilisateur(id),
  date_accouchement       TIMESTAMPTZ NOT NULL DEFAULT now(),
  type_accouchement       VARCHAR(20) CHECK (type_accouchement IN ('VOIE_BASSE','CESARIENNE','INSTRUMENTAL')),
  issue_mere              VARCHAR(20) CHECK (issue_mere IN ('VIVANTE','DECEDEE','TRANSFEREE')),
  issue_enfant            VARCHAR(20) CHECK (issue_enfant IN ('VIVANT','MORT_NE','DECEDE','TRANSFERE')),
  poids_enfant            NUMERIC(5,3),                   -- kg
  apgar_1min              SMALLINT,
  apgar_5min              SMALLINT,
  complication_mere       TEXT,
  complication_enfant     TEXT,
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- Consultations post-natales (CPoN)
CREATE TABLE cpon (
  id                      BIGSERIAL PRIMARY KEY,
  patient_id              BIGINT NOT NULL REFERENCES patient(id),      -- mère
  enfant_id               BIGINT REFERENCES patient(id),               -- enfant si enregistré
  formation_sanitaire_id  BIGINT NOT NULL REFERENCES formation_sanitaire(id),
  agent_id                BIGINT NOT NULL REFERENCES utilisateur(id),
  date_cpon               TIMESTAMPTZ NOT NULL DEFAULT now(),
  numero_cpon             SMALLINT NOT NULL CHECK (numero_cpon BETWEEN 1 AND 4),
  etat_mere               VARCHAR(50),
  etat_enfant             VARCHAR(50),
  allaitement_exclusif    BOOLEAN,
  vaccination_enfant      BOOLEAN,
  observations            TEXT,
  created_at              TIMESTAMPTZ DEFAULT now()
);
```

### 3.7. Nutrition (malnutrition)

```sql
CREATE TYPE type_malnutrition AS ENUM ('MAM', 'MAS', 'NORMAL');

CREATE TABLE nutrition (
  id                      BIGSERIAL PRIMARY KEY,
  patient_id              BIGINT NOT NULL REFERENCES patient(id),
  formation_sanitaire_id  BIGINT NOT NULL REFERENCES formation_sanitaire(id),
  agent_id                BIGINT NOT NULL REFERENCES utilisateur(id),
  date_evaluation         TIMESTAMPTZ NOT NULL DEFAULT now(),
  age_mois                SMALLINT NOT NULL,
  poids                   NUMERIC(5,2) NOT NULL,          -- kg
  taille                  NUMERIC(5,1) NOT NULL,          -- cm
  pb                      NUMERIC(4,1),                   -- périmètre brachial mm
  oedeme                  BOOLEAN DEFAULT false,
  classification          type_malnutrition NOT NULL,
  z_score_poids_taille    NUMERIC(3,2),
  z_score_poids_age       NUMERIC(3,2),
  z_score_taille_age      NUMERIC(3,2),
  pec_type                VARCHAR(30) CHECK (pec_type IN ('AMBULATOIRE','HOSPITALISATION','REFERENCE')),
  ration_distribuee       JSONB,                          -- type, quantité
  created_at              TIMESTAMPTZ DEFAULT now()
);
```

### 3.8. Pharmacie & Stocks

```sql
CREATE TABLE medicament (
  id                      BIGSERIAL PRIMARY KEY,
  dci                     VARCHAR(100) NOT NULL,          -- Dénomination Commune Internationale
  nom_commercial          VARCHAR(150),
  forme                   VARCHAR(50),                    -- comprimé, sirop, injectable...
  dosage                  VARCHAR(50),                    -- ex: 500mg, 250mg/5ml
  unite                   VARCHAR(20),                    -- boîte, flacon, ampoule
  categorie               VARCHAR(50),                    -- antibiotique, antipaludéen...
  liste_essentielle       BOOLEAN DEFAULT false,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stock (
  id                      BIGSERIAL PRIMARY KEY,
  formation_sanitaire_id  BIGINT NOT NULL REFERENCES formation_sanitaire(id),
  medicament_id           BIGINT NOT NULL REFERENCES medicament(id),
  lot_numero              VARCHAR(50) NOT NULL,
  date_peremption         DATE NOT NULL,
  quantite_entree         INT NOT NULL DEFAULT 0,
  quantite_sortie         INT NOT NULL DEFAULT 0,
  quantite_actuelle       INT GENERATED ALWAYS AS (quantite_entree - quantite_sortie) STORED,
  prix_unitaire           NUMERIC(12,2),
  fournisseur             VARCHAR(100),
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE (formation_sanitaire_id, medicament_id, lot_numero)
);

CREATE INDEX idx_stock_peremption ON stock (formation_sanitaire_id, date_peremption);
CREATE INDEX idx_stock_rupture ON stock (formation_sanitaire_id) WHERE quantite_actuelle <= 0;

-- Mouvements de stock (audit trail)
CREATE TABLE mouvement_stock (
  id                      BIGSERIAL PRIMARY KEY,
  stock_id                BIGINT NOT NULL REFERENCES stock(id),
  type_mouvement          VARCHAR(20) CHECK (type_mouvement IN ('ENTREE','SORTIE','AJUSTEMENT','PERTE','PERIME')),
  quantite                INT NOT NULL,
  motif                   VARCHAR(100),                   -- consultation, vaccination, ajustement inventaire...
  reference_id            BIGINT,                         -- ID consultation/vaccination/etc.
  agent_id                BIGINT NOT NULL REFERENCES utilisateur(id),
  created_at              TIMESTAMPTZ DEFAULT now()
);
```

### 3.9. Laboratoire

```sql
CREATE TYPE type_examen AS ENUM (
  'HEMATOLOGIE', 'BIOCHIMIE', 'PARASITOLOGIE', 'BACTERIOLOGIE',
  'SEROLOGIE', 'VIROLOGIE', 'AUTRE'
);

CREATE TABLE examen_laboratoire (
  id                      BIGSERIAL PRIMARY KEY,
  patient_id              BIGINT NOT NULL REFERENCES patient(id),
  formation_sanitaire_id  BIGINT NOT NULL REFERENCES formation_sanitaire(id),
  agent_prescripteur_id   BIGINT NOT NULL REFERENCES utilisateur(id),
  agent_realisation_id    BIGINT REFERENCES utilisateur(id),
  type_examen             type_examen NOT NULL,
  examen_code             VARCHAR(20),                    -- code LOINC ou local
  examen_libelle          VARCHAR(150) NOT NULL,
  date_prescription       TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_prelevement        TIMESTAMPTZ,
  date_resultat           TIMESTAMPTZ,
  resultat                JSONB,                          -- valeurs structurées
  interpretation          VARCHAR(50),                    -- NORMAL, ANORMAL, CRITIQUE
  commentaire             TEXT,
  statut                  VARCHAR(20) DEFAULT 'PRESCRIT' CHECK (statut IN ('PRESCRIT','EN_COURS','TERMINE','ANNULE')),
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);
```

### 3.10. Hospitalisation

```sql
CREATE TABLE lit (
  id                      BIGSERIAL PRIMARY KEY,
  formation_sanitaire_id  BIGINT NOT NULL REFERENCES formation_sanitaire(id),
  service                 VARCHAR(50) NOT NULL,           -- pédiatrie, maternité, médecine...
  numero                  VARCHAR(20) NOT NULL,
  type_lit                VARCHAR(20) CHECK (type_lit IN ('STANDARD','REA','NEONAT','MATERNITE')),
  actif                   BOOLEAN DEFAULT true,
  UNIQUE (formation_sanitaire_id, service, numero)
);

CREATE TABLE hospitalisation (
  id                      BIGSERIAL PRIMARY KEY,
  patient_id              BIGINT NOT NULL REFERENCES patient(id),
  lit_id                  BIGINT NOT NULL REFERENCES lit(id),
  agent_admission_id      BIGINT NOT NULL REFERENCES utilisateur(id),
  agent_sortie_id         BIGINT REFERENCES utilisateur(id),
  date_admission          TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_sortie             TIMESTAMPTZ,
  motif_admission         TEXT,
  diagnostic_entree       VARCHAR(200),
  diagnostic_sortie       VARCHAR(200),
  issue                   VARCHAR(20) CHECK (issue IN ('GUERISON','AMELIORATION','DECES','TRANSFERT','FUGUE','REFUS_SOINS')),
  transfert_vers_id       BIGINT REFERENCES formation_sanitaire(id),
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);
```

### 3.11. Références / Contre-références

```sql
CREATE TYPE statut_reference AS ENUM ('INITIEE', 'EN_COURS', 'ARRIVEE', 'PRISE_EN_CHARGE', 'RETOUR', 'ANNULEE');

CREATE TABLE reference (
  id                      BIGSERIAL PRIMARY KEY,
  patient_id              BIGINT NOT NULL REFERENCES patient(id),
  formation_origine_id    BIGINT NOT NULL REFERENCES formation_sanitaire(id),
  formation_destination_id BIGINT NOT NULL REFERENCES formation_sanitaire(id),
  agent_initiateur_id     BIGINT NOT NULL REFERENCES utilisateur(id),
  agent_recepteur_id      BIGINT REFERENCES utilisateur(id),
  motif                   TEXT NOT NULL,
  urgence                 VARCHAR(10) CHECK (urgence IN ('NORMALE','URGENTE','TRES_URGENTE')),
  date_initiation         TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_arrivee            TIMESTAMPTZ,
  date_prise_en_charge    TIMESTAMPTZ,
  date_retour             TIMESTAMPTZ,
  compte_rendu            TEXT,
  medicaments_donnes      JSONB,
  statut                  statut_reference DEFAULT 'INITIEE',
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);
```

### 3.12. Surveillance épidémiologique

```sql
CREATE TABLE maladie_declaration_obligatoire (
  id                      SMALLSERIAL PRIMARY KEY,
  code                    VARCHAR(10) NOT NULL UNIQUE,    -- PALU, CHOL, ROUG, MENI...
  nom                     VARCHAR(100) NOT NULL,
  nom_haoussa             VARCHAR(100),
  nom_zarma               VARCHAR(100),
  seuil_alerte_district   INT,                            -- cas/semaine/district
  seuil_alerte_region     INT,                            -- cas/semaine/région
  delai_declaration_heures INT DEFAULT 24,
  created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cas_maladie (
  id                      BIGSERIAL PRIMARY KEY,
  patient_id              BIGINT NOT NULL REFERENCES patient(id),
  maladie_id              SMALLINT NOT NULL REFERENCES maladie_declaration_obligatoire(id),
  formation_sanitaire_id  BIGINT NOT NULL REFERENCES formation_sanitaire(id),
  agent_id                BIGINT NOT NULL REFERENCES utilisateur(id),
  date_declaration        TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_debut_symptomes    DATE,
  classification          VARCHAR(20) CHECK (classification IN ('SUSPECT','PROBABLE','CONFIRME','ELIMINE')),
  issue                   VARCHAR(20) CHECK (issue IN ('GUERISON','DECES','EN_COURS','TRANSFERE','PERDUS_VUE')),
  laboratoire_confirmation BOOLEAN DEFAULT false,
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- Alertes automatiques (calculées par job cron ou trigger)
CREATE TABLE alerte_epidemiologique (
  id                      BIGSERIAL PRIMARY KEY,
  maladie_id              SMALLINT NOT NULL REFERENCES maladie_declaration_obligatoire(id),
  region_id               SMALLINT REFERENCES region(id),
  district_id             INT REFERENCES district(id),
  formation_sanitaire_id  BIGINT REFERENCES formation_sanitaire(id),
  periode_debut           DATE NOT NULL,
  periode_fin             DATE NOT NULL,
  nombre_cas              INT NOT NULL,
  seuil_decleche          INT NOT NULL,
  niveau                  VARCHAR(20) CHECK (niveau IN ('FORMATION','DISTRICT','REGION','NATIONAL')),
  statut                  VARCHAR(20) DEFAULT 'ACTIVE' CHECK (statut IN ('ACTIVE','TRAITEE','RESOLUE','FAUSSE_ALERTE')),
  created_at              TIMESTAMPTZ DEFAULT now(),
  resolue_par             BIGINT REFERENCES utilisateur(id),
  resolue_at              TIMESTAMPTZ
);
```

### 3.13. Rapports mensuels (remplace papier)

```sql
CREATE TABLE rapport_mensuel (
  id                      BIGSERIAL PRIMARY KEY,
  formation_sanitaire_id  BIGINT NOT NULL REFERENCES formation_sanitaire(id),
  annee                   SMALLINT NOT NULL,
  mois                    SMALLINT NOT NULL CHECK (mois BETWEEN 1 AND 12),
  statut                  VARCHAR(20) DEFAULT 'BROUILLON' CHECK (statut IN ('BROUILLON','SOUMIS','VALIDE','REJETE')),
  donnees                 JSONB NOT NULL,                 -- toutes les sections du rapport
  genere_par              BIGINT REFERENCES utilisateur(id),
  valide_par              BIGINT REFERENCES utilisateur(id),
  date_generation         TIMESTAMPTZ DEFAULT now(),
  date_validation         TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE (formation_sanitaire_id, annee, mois)
);
```

### 3.14. Ressources humaines & Équipements

```sql
CREATE TABLE personnel (
  id                      BIGSERIAL PRIMARY KEY,
  formation_sanitaire_id  BIGINT NOT NULL REFERENCES formation_sanitaire(id),
  utilisateur_id          BIGINT UNIQUE REFERENCES utilisateur(id), -- si a compte
  matricule               VARCHAR(30),
  prenom                  VARCHAR(50) NOT NULL,
  nom                     VARCHAR(50) NOT NULL,
  sexe                    CHAR(1) CHECK (sexe IN ('M','F')),
  date_naissance          DATE,
  qualification           VARCHAR(100),                   -- médecin, infirmier, sage-femme, agent santé...
  specialite              VARCHAR(100),
  date_entree_fonction    DATE,
  statut                  VARCHAR(20) DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF','CONGE','MUTATION','RETRAITE','DECEDE')),
  telephone               VARCHAR(20),
  email                   VARCHAR(100),
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE equipement (
  id                      BIGSERIAL PRIMARY KEY,
  formation_sanitaire_id  BIGINT NOT NULL REFERENCES formation_sanitaire(id),
  nom                     VARCHAR(100) NOT NULL,
  categorie               VARCHAR(50),                    -- froid, laboratoire, imagerie, réanimation...
  marque                  VARCHAR(50),
  modele                  VARCHAR(50),
  numero_serie            VARCHAR(100),
  date_acquisition        DATE,
  date_derniere_maintenance DATE,
  frequence_maintenance_jours INT,
  statut                  VARCHAR(20) DEFAULT 'FONCTIONNEL' CHECK (statut IN ('FONCTIONNEL','EN_PANNE','MAINTENANCE','HORS_SERVICE','REFORME')),
  valeur_acquisition      NUMERIC(14,2),
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);
```

### 3.15. Module Projets & Partenaires

```sql
CREATE TYPE type_partenaire AS ENUM (
  'MINISTERE', 'INSTITUTION_PUBLIQUE', 'ONG_NATIONALE', 'ONG_INTERNATIONALE',
  'AGENCE_ONU', 'BAILLEUR_BILATERAL', 'BAILLEUR_MULTILATERAL', 'FONDATION', 'AUTRE'
);

CREATE TABLE partenaire (
  id                      BIGSERIAL PRIMARY KEY,
  nom                     VARCHAR(150) NOT NULL,
  sigle                   VARCHAR(20),
  type                    type_partenaire NOT NULL,
  pays_siege              VARCHAR(50),
  adresse                 TEXT,
  telephone               VARCHAR(20),
  email                   VARCHAR(100),
  site_web                VARCHAR(200),
  personne_contact_nom    VARCHAR(100),
  personne_contact_fonction VARCHAR(100),
  personne_contact_email  VARCHAR(100),
  personne_contact_tel    VARCHAR(20),
  actif                   BOOLEAN DEFAULT true,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE projet (
  id                      BIGSERIAL PRIMARY KEY,
  partenaire_id           BIGINT NOT NULL REFERENCES partenaire(id),
  titre                   VARCHAR(200) NOT NULL,
  description             TEXT,
  regions                 SMALLINT[] NOT NULL DEFAULT '{}',  -- IDs régions couvertes
  districts               INT[] NOT NULL DEFAULT '{}',        -- IDs districts couverts
  date_debut              DATE NOT NULL,
  date_fin                DATE,
  budget_total            NUMERIC(18,2),
  devise                  CHAR(3) DEFAULT 'XOF',
  statut                  VARCHAR(20) DEFAULT 'EN_COURS' CHECK (statut IN ('EN_PREPARATION','EN_COURS','SUSPENDU','TERMINE','ANNULE')),
  responsable_nom         VARCHAR(100),
  responsable_email       VARCHAR(100),
  responsable_telephone   VARCHAR(20),
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  created_by              BIGINT REFERENCES utilisateur(id)
);

-- Indicateurs de projet (configurables)
CREATE TABLE indicateur_projet (
  id                      BIGSERIAL PRIMARY KEY,
  projet_id               BIGINT NOT NULL REFERENCES projet(id),
  code                    VARCHAR(30) NOT NULL,
  nom                     VARCHAR(150) NOT NULL,
  definition              TEXT,
  unite                   VARCHAR(30),                      -- nombre, pourcentage, taux...
  frequence_collecte      VARCHAR(20) CHECK (frequence_collecte IN ('MENSUEL','TRIMESTRIEL','SEMESTRIEL','ANNUEL','PONCTUEL')),
  valeur_cible            NUMERIC(14,4),
  disagregation           JSONB,                           -- par âge, sexe, district...
  actif                   BOOLEAN DEFAULT true,
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- Collecte périodique valeurs indicateurs
CREATE TABLE valeur_indicateur (
  id                      BIGSERIAL PRIMARY KEY,
  indicateur_id           BIGINT NOT NULL REFERENCES indicateur_projet(id),
  periode_debut           DATE NOT NULL,
  periode_fin             DATE NOT NULL,
  valeur                  NUMERIC(14,4) NOT NULL,
  disagregation_valeurs   JSONB,
  source                  VARCHAR(50),                      -- DHIS2, rapport_activite, enquête...
  collecte_par            BIGINT REFERENCES utilisateur(id),
  valide_par              BIGINT REFERENCES utilisateur(id),
  date_collecte           TIMESTAMPTZ DEFAULT now(),
  date_validation         TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT now()
);
```

### 3.16. Audit & Sécurité

```sql
-- Journal d'audit universel (trigger sur toutes tables sensibles)
CREATE TABLE audit_log (
  id                      BIGSERIAL PRIMARY KEY,
  table_name              VARCHAR(100) NOT NULL,
  record_id               BIGINT NOT NULL,
  action                  VARCHAR(10) NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  old_data                JSONB,
  new_data                JSONB,
  changed_fields          TEXT[],
  utilisateur_id          BIGINT REFERENCES utilisateur(id),
  formation_sanitaire_id  BIGINT REFERENCES formation_sanitaire(id),
  ip_address              INET,
  user_agent              TEXT,
  created_at              TIMESTAMPTZ DEFAULT now()
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_audit_table_record ON audit_log (table_name, record_id);
CREATE INDEX idx_audit_user ON audit_log (utilisateur_id);
CREATE INDEX idx_audit_formation ON audit_log (formation_sanitaire_id);
CREATE INDEX idx_audit_date ON audit_log (created_at);

-- Connexions (sessions)
CREATE TABLE session_connexion (
  id                      BIGSERIAL PRIMARY KEY,
  utilisateur_id          BIGINT NOT NULL REFERENCES utilisateur(id),
  token_hash              VARCHAR(255) NOT NULL,            -- hash du token JWT
  ip_address              INET,
  user_agent              TEXT,
  formation_sanitaire_id  BIGINT REFERENCES formation_sanitaire(id),
  date_debut              TIMESTAMPTZ DEFAULT now(),
  date_fin                TIMESTAMPTZ,
  active                  BOOLEAN DEFAULT true,
  created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_session_user_active ON session_connexion (utilisateur_id, active);
```

---

## 4. Row-Level Security (RLS) — Stratégie complète

### 4.1. Rôles PostgreSQL mappés aux rôles applicatifs

| Rôle PostgreSQL | Rôle Applicatif | Politique |
|-----------------|-----------------|-----------|
| `role_admin_national` | ADMIN_NATIONAL | `USAGE` sur tout, `BYPASSRLS` |
| `role_superviseur_national` | SUPERVISEUR_NATIONAL | Lecture toutes tables, pas d'écriture système |
| `role_superviseur_regional` | SUPERVISEUR_REGIONAL | Lecture/écriture **sa région seulement** |
| `role_agent_sante` | AGENT_SANTE | Lecture/écriture **sa formation seulement** |

### 4.2. Exemples de politiques RLS (Drizzle `pgPolicy`)

```typescript
// Formation sanitaire : agent voit seulement la sienne
db.execute(sql`
  CREATE POLICY agent_formation_isolation ON formation_sanitaire
  FOR ALL TO role_agent_sante
  USING (id = current_setting('app.current_formation_id')::bigint)
  WITH CHECK (id = current_setting('app.current_formation_id')::bigint)
`);

// Patient : agent voit patients de sa formation + créés ailleurs mais consultés chez lui
db.execute(sql`
  CREATE POLICY agent_patient_access ON patient
  FOR SELECT TO role_agent_sante
  USING (
    formation_creation_id = current_setting('app.current_formation_id')::bigint
    OR id IN (
      SELECT patient_id FROM consultation
      WHERE formation_sanitaire_id = current_setting('app.current_formation_id')::bigint
    )
  )
`);

// Superviseur régional : tout dans sa région
db.execute(sql`
  CREATE POLICY superviseur_region_access ON patient
  FOR SELECT TO role_superviseur_regional
  USING (
    formation_creation_id IN (
      SELECT id FROM formation_sanitaire
      WHERE district_id IN (
        SELECT id FROM district WHERE region_id = current_setting('app.current_region_id')::smallint
      )
    )
  )
`);

// Consultation partitionnée : même logique via current_setting
```

### 4.3. Injection du contexte via Middleware Next.js

```typescript
// middleware.ts — définit les variables de session PG avant chaque requête API
export async function middleware(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const headers = new Headers(request.headers);
    headers.set('x-pg-role', mapRoleToPgRole(session.user.role));
    headers.set('x-user-id', session.user.id.toString());
    headers.set('x-formation-id', session.user.formationSanitaireId?.toString() || '');
    headers.set('x-region-id', session.user.regionId?.toString() || '');
    // Transmis à Postgres via pool option `application_name` ou `SET LOCAL`
  }
  return NextResponse.next({ request: { headers } });
}
```

---

## 5. Architecture Frontend (Next.js App Router)

### 5.1. Structure dossiers

```
src/
├── app/
│   ├── (auth)/                    # Route group : login, register, 2FA
│   │   ├── login/
│   │   ├── register/
│   │   └── two-factor/
│   ├── (dashboard)/               # Route group protégé par middleware
│   │   ├── admin/                 # Admin national
│   │   ├── national/              # Superviseur national
│   │   ├── regional/              # Superviseur régional
│   │   └── agent/                 # Agent de santé
│   ├── api/                       # Route Handlers (REST + Server Actions)
│   │   ├── auth/
│   │   ├── patients/
│   │   ├── consultations/
│   │   ├── vaccinations/
│   │   ├── stocks/
│   │   ├── rapports/
│   │   └── projets/
│   ├── layout.tsx                 # Root layout + providers
│   ├── page.tsx                   # Landing / redirection selon rôle
│   └── globals.css                # Tailwind + CSS variables
├── components/
│   ├── ui/                        # Composants de base (Button, Input, Table, Card, Modal...)
│   ├── forms/                     # Formulaires métier (PatientForm, ConsultationForm...)
│   ├── charts/                    # Graphiques Recharts wrappers
│   ├── maps/                      # Carte Niger (SVG/GeoJSON interactif)
│   └── layout/                    # Sidebar, Header, Breadcrumbs
├── lib/
│   ├── db/                        # Drizzle client, schema, migrations
│   ├── auth/                      # NextAuth config, callbacks, RLS helpers
│   ├── validation/                # Schémas Zod partagés
│   ├── offline/                   # IndexedDB, sync queue, conflict resolution
│   ├── i18n/                      # next-intl config, messages fr/ha/zm
│   ├── pdf/                       # @react-pdf templates
│   └── utils/                     # Helpers (dates, formats, calculs z-score...)
├── hooks/                         # React hooks custom (useOffline, useSync...)
├── types/                         # Types TS globaux (inférés Drizzle + Zod)
├── middleware.ts                  # Auth + RLS context injection
└── instrumentation.ts             # OpenTelemetry / Sentry init
```

### 5.2. PWA & Mode hors-ligne

| Composant | Technologie | Détail |
|-----------|-------------|--------|
| Service Worker | Workbox (via `next-pwa`) | `StaleWhileRevalidate` pour assets, `NetworkFirst` pour API |
| Stockage local | IndexedDB (`idb` wrapper) | Tables : `patients`, `consultations`, `vaccinations`, `syncQueue` |
| File d'attente sync | Table `syncQueue` (id, type, payload, timestamp, retryCount, status) | Statuts : `pending`, `syncing`, `conflict`, `failed`, `synced` |
| Résolution conflits | Last-Write-Wins (timestamp serveur) + UI manuelle si champs critiques | Champs critiques : diagnostic, traitement → alerte utilisateur |
| Indicateurs UI | Badge "Hors ligne", compteur en attente, sync manuel/auto | Accessible, gros boutons, feedback visuel fort |

### 5.3. i18n — Structure messages

```
messages/
├── fr.json          # Français (défaut)
├── ha.json          # Haoussa
└── zm.json          # Zarma
```

Clés partagées : `nav.dashboard`, `form.patient.nom`, `table.actions.edit`, `alert.sync.pending`...

---

## 6. API & Validation (Zod)

### 6.1. Schémas partagés (exemple)

```typescript
// lib/validation/patient.ts
export const patientCreateSchema = z.object({
  nom: z.string().min(1).max(100),
  prenom: z.string().min(1).max(100),
  dateNaissance: z.string().date().optional(),
  ageEstime: z.number().int().min(0).max(120).optional(),
  sexe: z.enum(['M', 'F']),
  village: z.string().max(100).optional(),
  quartier: z.string().max(100).optional(),
  personneContactNom: z.string().max(100).optional(),
  personneContactTel: z.string().max(20).optional(),
  telephone: z.string().max(20).optional(),
}).refine(d => d.dateNaissance || d.ageEstime, {
  message: "Date de naissance ou âge estimé requis",
  path: ["dateNaissance"]
});

export type PatientCreate = z.infer<typeof patientCreateSchema>;
```

### 6.2. Server Actions (mutation) + Route Handlers (lecture/export)

```typescript
// app/api/patients/route.ts (GET avec pagination, filtres)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const query = searchParams.get('q') || '';
  const formationId = getCurrentFormationId(); // via headers RLS
  
  const [data, total] = await db.transaction(async (tx) => {
    const where = and(
      eq(patient.formationCreationId, formationId),
      query ? or(
        ilike(patient.nom, `%${query}%`),
        ilike(patient.prenom, `%${query}%`),
        eq(patient.identifiantNational, query)
      ) : undefined
    );
    return Promise.all([
      tx.select().from(patient).where(where).limit(limit).offset((page-1)*limit).orderBy(desc(patient.createdAt)),
      tx.select({ count: count() }).from(patient).where(where)
    ]);
  });
  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total/limit) });
}

// app/actions/patient.ts (Server Action mutation)
'use server';
export async function createPatient(formData: FormData) {
  const validated = patientCreateSchema.parse(Object.fromEntries(formData));
  const session = await getServerSession();
  const idNational = generateNationalId(); // SN-YYYY-XXXXXXXX
  
  await db.insert(patient).values({
    ...validated,
    identifiantNational: idNational,
    formationCreationId: session.user.formationSanitaireId!,
    createdBy: session.user.id,
  });
  revalidatePath('/agent/patients');
  return { success: true, idNational };
}
```

---

## 7. Sécurité — Détails implémentation

| Mesure | Implémentation |
|--------|----------------|
| **Mots de passe** | Argon2id (via `@node-rs/argon2`), min 12 caractères, vérification `zxcvbn` côté client |
| **2FA (TOTP)** | `otplib` + QR code, obligatoire pour ADMIN_NATIONAL, SUPERVISEUR_NATIONAL, SUPERVISEUR_REGIONAL |
| **Verrouillage compte** | 5 échecs → verrou 15 min, 10 échecs → verrou 1h, admin pour déverrouiller |
| **Expiration session** | JWT 15 min (access) + refresh token 7j (rotation, détection vol) |
| **Journal connexions** | Table `session_connexion` + `audit_log` sur auth |
| **Chiffrement champs sensibles** | `pgcrypto` : `pgp_sym_encrypt(telephone, current_setting('app.encryption_key'))` |
| **CSP / Headers** | `next-secure-headers` : CSP strict, HSTS, X-Frame-Options, Referrer-Policy |
| **Rate limiting** | `arcjet` ou middleware custom (IP + user) sur `/api/auth/*` |
| **Secrets** | `.env.example` fourni, jamais de secrets en Git, rotation clés chiffrement annuelle |

---

## 8. Tests — Stratégie

| Type | Outil | Couverture cible | Spécificités |
|------|-------|------------------|--------------|
| **Unitaires** | Vitest | ≥ 80% (lib/, hooks/, validation/) | Tests RLS via `pgTAP` ou mock pool |
| **Intégration API** | Vitest + Testcontainers (PostgreSQL) | Tous endpoints critiques | Seed data fictif, rollback par test |
| **E2E** | Playwright | Parcours critiques par rôle | Mobile + desktop, mode hors-ligne simulé |
| **Accès/RBAC** | Tests dédiés | **100% matrices** | Agent ≠ autre formation, Superviseur régional ≠ autre région |
| **Performance** | k6 / Artillery | 2G/3G simulé (throttle) | Pages < 200ko gzip, TTFB < 800ms |

### 8.1. Données de test (seed fictif uniquement)

- 8 régions, ~50 districts, ~500 formations
- ~5000 patients fictifs (noms africains générés, localités réelles du Niger)
- Consultations/vaccinations/CPN cohérentes (dates, diagnostics CIM-10 valides)
- Stocks avec péremptions variées, ruptures simulées
- Projets/partenaires fictifs (ONG connues, bailleurs)

---

## 9. CI/CD — GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_PASSWORD: test }
        ports: [5432:5432]
        options: --health-cmd="pg_isready" --health-interval=10s
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:migrate
      - run: pnpm db:seed
      - run: pnpm test --coverage
  build:
    needs: [lint-typecheck, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
```

---

## 10. Déploiement & Ops

| Environnement | Cible | Base de données |
|---------------|-------|-----------------|
| **Développement** | Local (Docker Compose) | PostgreSQL 16 local |
| **Staging** | Vercel Preview / Netlify Preview | Neon (branche `staging`) |
| **Production** | Vercel Pro / Node standalone sur VPS | Supabase Pro / Neon Pro / PostgreSQL managé |

### 10.1. Sauvegardes

- **Automatiques** : Snapshots quotidiens (provider) + `pg_dump` logique hebdomadaire vers S3/MinIO chiffré
- **Restauration** : Procédure documentée (`docs/restore-procedure.md`), testée trimestriellement
- **Point-in-time recovery** : Activé (WAL archiving)

### 10.2. Monitoring

- **APM** : Sentry (erreurs, performance) + Vercel Analytics
- **Base** : `pg_stat_statements`, alertes lenteurs (>1s), connexions >80% max
- **Métriques métier** : Sync queue length, taux échecs sync, utilisateurs actifs/jour

---

## 11. Accessibilité & UX (contraintes 2G/3G)

- **Pages légères** : < 200 ko HTML+CSS+JS gzippé (pas de grosses libs inutiles)
- **Lazy loading** : Composants lourds (cartes, graphiques, PDF) en `dynamic()` + `ssr: false`
- **Images** : `next/image` + WebP/AVIF, placeholders blur, tailles responsives
- **Formulaires** : `react-hook-form` + Zod resolver, validation instantanée, auto-save brouillon local
- **Contrastes** : Ratio ≥ 4.5:1 (WCAG AA), mode haut contraste optionnel
- **Clavier** : Focus visible, ordre logique, raccourcis (Alt+N = nouveau patient)
- **Offline-first** : Indicateurs clairs, actions mises en file d'attente, sync en arrière-plan

---

## 12. Documentation à produire

| Document | Format | Public |
|----------|--------|--------|
| `README.md` | Markdown | Tous |
| `docs/schema-db.md` | Markdown + Mermaid ERD | Dev, DBA |
| `docs/deployment.md` | Markdown | DevOps, Admin |
| `docs/user-guide-admin.md` | Markdown | Admin national |
| `docs/user-guide-superviseur-national.md` | Markdown | Superviseur national |
| `docs/user-guide-superviseur-regional.md` | Markdown | Superviseurs régionaux |
| `docs/user-guide-agent.md` | Markdown + captures | Agents de santé |
| `docs/api-reference.md` | Markdown (OpenAPI généré) | Dev externes |
| `docs/restore-procedure.md` | Markdown | DBA, Admin |

---

## 13. Plan de livraison détaillé (Phases 1–6)

### Phase 1 — Fondation (Semaines 1–3)
| Tâche | Livrable |
|-------|----------|
| Init Next.js + TypeScript + Tailwind + ESLint/Prettier | Repo prêt, `pnpm dev` fonctionne |
| Config Drizzle + migrations initiales (schéma §3) | `pnpm db:migrate` crée toutes tables |
| Seed données géographiques (8 régions, districts, 500+ formations) | `pnpm db:seed` peuplement complet |
| NextAuth v5 : credentials + 2FA (TOTP) + callbacks RLS | Login, register, 2FA setup, session |
| Middleware injection `current_setting` pour RLS | Contexte PG propagé |
| Politiques RLS complètes (§4) + tests d'accès | Matrice d'accès validée par tests |
| Admin national : CRUD utilisateurs, validation inscriptions | Interface admin fonctionnelle |
| Superviseur régional : création/validation agents sa région | Interface superviseur régional |
| **Tests** : Unitaires (auth, RLS), Intégration (API auth), E2E (parcours login) | Coverage ≥ 80% |

### Phase 2 — Patients & Consultations + Hors-ligne (Semaines 4–6)
| Tâche | Livrable |
|-------|----------|
| Registre patients : CRUD, recherche approximative (trigram), doublons | Interface patient complète |
| Génération ID national unique (SN-YYYY-XXXXXXXX) | Algo collision-résistant |
| Fusion patients contrôlée + audit | UI fusion + trail |
| Consultations : CRUD, CIM-10 (autocomplete), ordonnance JSON | Formulaire consultation |
| Mode hors-ligne : SW + IndexedDB + sync queue | PWA installable, offline ready |
| Résolution conflits sync (LWW + UI manuelle) | Sync robuste |
| **Tests** : Offline/online, conflits, recherche patients, RLS consultations | 100% parcours critiques |

### Phase 3 — Modules cliniques (Semaines 7–10)
| Module | Semaine | Détails |
|--------|---------|---------|
| Vaccination (PEV) | 7 | Calendrier, doses, lots, péremptions, carte vaccinale PDF |
| CPN / Accouchements / CPoN | 8 | Suivi grossesse, partogramme simplifié, indicateurs OMS |
| Nutrition (MAM/MAS) | 9 | Z-scores OMS auto, PEC, rations, suivi |
| Pharmacie & Stocks | 10 | Entrées/sorties, alertes rupture/péremption, inventaire, mouvements |
| Laboratoire | 10 | Prescription, résultats, seuils alerte, impression bon |
| **Tests** : Chaque module + intégration (patient → consultation → vaccin → stock) | | |

### Phase 4 — Tableaux de bord & Rapports (Semaines 11–13)
| Tâche | Livrable |
|-------|----------|
| Dashboards par rôle (Admin, National, Régional, Agent) | Cartes, graphiques, KPI, filtres période/pathologie |
| Carte Niger interactive (SVG/GeoJSON) | Drill-down région → district → formation |
| Rapports mensuels auto-générés (JSON → PDF/Excel) | Remplace papier, sections complètes |
| Export DHIS2 (API + format d'échange) | Compatibilité bidirectionnelle |
| **Tests** : Génération rapports, exports, perf dashboards | |

### Phase 5 — Projets/Partenaires & Surveillance épi (Semaines 14–16)
| Tâche | Livrable |
|-------|----------|
| Répertoire partenaires + projets (CRUD admin) | Fiches complètes, zones, budget, indicateurs |
| Indicateurs configurables + collecte périodique | Formulaires dynamiques, validation workflow |
| Maladies à déclaration obligatoire + seuils | Paramétrage admin national |
| Alertes automatiques (cron job + triggers) | Temps réel, notification dashboard/email |
| **Tests** : Alertes seuils, collecte indicateurs, RBAC projets | |

### Phase 6 — Durcissement & Pilote (Semaines 17–20)
| Tâche | Livrable |
|-------|----------|
| Audit sécurité complet (pentest interne, RLS, secrets) | Rapport + correctifs |
| Tests de charge (k6) : 1000 agents simultanés, sync massique | Métriques, optimisations |
| Optimisation requêtes (index, partition, materialized views) | Perf < 500ms p95 |
| Documentation complète (§12) | Tous guides publiés |
| Formation formateurs (3 sessions visio) | Supports + enregistrements |
| **Pilote région** : Déploiement 1 région (ex: Niamey), 50 formations | Retours, correctifs, validation Go/No-Go national |

---

## 14. Estimation effort (équipe 3–4 devs)

| Phase | Durée | Points clés |
|-------|-------|-------------|
| Phase 1 | 3 sem | Fondation critique, RLS, auth |
| Phase 2 | 3 sem | Hors-ligne complexe, sync |
| Phase 3 | 4 sem | Modules métiers riches |
| Phase 4 | 3 sem | Dashboards, rapports, DHIS2 |
| Phase 5 | 3 sem | Projets, surveillance épi |
| Phase 6 | 4 sem | Durcissement, pilote, docs |
| **Total** | **~20 semaines** | ~5 mois |

---

## 15. Décisions en attente / Questions pour validation

1. **Hébergement production** : Préférence Supabase vs Neon vs VPS managé ? (Impact coûts, RLS, backup)
2. **Auth externe** : Intégration future Annuaire national / LDAP / FranceConnect ? (Prévoir abstraction)
3. **SMS/Notifications** : Fournisseur local (Orange Niger, Moov) pour alertes, rappels RDV, 2FA fallback ?
4. **Cartographie** : GeoJSON officiel Niger disponible ? Sinon source OSM + simplification ?
5. **CIM-10** : Version OMS 2025 ou version nationale adaptée ? Fichier source ?
6. **DHIS2** : Instance existante au Niger ? Version ? API ou export fichiers uniquement ?
7. **Langues** : Traductions haoussa/zarma — ressources internes ou externes ? Priorité Phase 1 ou ultérieure ?
8. **Équipe** : Nombre de développeurs disponibles ? Compétences Next.js/Drizzle/PostgreSQL ?
9. **Calendrier** : Date cible pilote ? Date cible déploiement national ?

---

## 16. Prochaines étapes (après validation Phase 0)

1. **Initialisation repo** : `git init`, structure dossiers, `package.json`, `tsconfig.json`, configs outils
2. **Drizzle setup** : Schéma TypeScript (§3), fichier migration initiale, script seed géographie
3. **NextAuth + RLS** : Configuration complète, middleware, politiques PG
4. **Premier commit** : `feat: Phase 1 — Fondation (auth, RLS, géographie, admin)`
5. **CI/CD** : Pipeline GitHub Actions fonctionnel

---

**En attente de votre validation pour lancer la Phase 1.**