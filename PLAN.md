# PLAN DE TRAVAIL - Santé Numérique Niger

## PHASE 1 : FONDATION (Terminée/Finalisation)
- [x] Initialisation du dépôt et de la structure
- [x] Schémas de base de données (Drizzle)
- [x] Configuration NextAuth v5
- [x] API Routes de base (auth, géographie)
- [x] Pages Login & Inscription (Frontend)
- [x] Seed de données géographiques
- [ ] Lancement des migrations initiales (Bloqué: Pas de DB accessible)
- [ ] Test du cycle d'authentification complet

## PHASE 2 : PATIENTS, CONSULTATIONS & HORS-LIGNE
- [ ] Registre Patients : Liste, Recherche (Trigram), Détails
- [ ] Registre Patients : Formulaire de création (Zod + Server Actions)
- [ ] Consultations : Formulaire de saisie (CIM-10, Ordonnance JSON)
- [ ] Consultations : Historique par patient
- [ ] PWA : Configuration Service Worker (Workbox)
- [ ] Stockage Local : Implémentation IndexedDB (idb)
- [ ] Synchronisation : File d'attente (Sync Queue) et gestion des conflits
- [ ] UX : Indicateurs de statut de connexion et de synchronisation

## PHASE 3 : MODULES CLINIQUES (PEV, Maternelle, Pharmacie)
- [ ] Vaccination : Calendrier PEV et suivi des doses
- [ ] Maternelle : Consultations Prénatales (CPN)
- [ ] Maternelle : Suivi des Accouchements et CPON
- [ ] Nutrition : Suivi MAM/MAS (Z-scores)
- [ ] Pharmacie : Catalogue des médicaments
- [ ] Pharmacie : Gestion des stocks et mouvements (entrées/sorties)
- [ ] Laboratoire : Prescriptions et résultats

## PHASE 4 : TABLEAUX DE BORD & RAPPORTS
- [ ] Dashboard Agent : Indicateurs locaux
- [ ] Dashboard Régional/National : Cartes et agrégats
- [ ] Rapports : Génération automatique du rapport mensuel (RMA)
- [ ] Exports : PDF et Excel (xlsx)
- [ ] Interopérabilité : Export format DHIS2

## PHASE 5 : PROJETS & SURVEILLANCE ÉPIDÉMIOLOGIQUE
- [ ] Répertoire des partenaires et projets
- [ ] Collecte d'indicateurs de projets
- [ ] Surveillance : Déclaration des maladies obligatoires
- [ ] Alertes : Système de seuils et notifications

## PHASE 6 : SÉCURITÉ, TESTS & FINALISATION
- [ ] Durcissement : Audit RLS et pgcrypto
- [ ] Tests : Tests d'intégration RBAC complets
- [ ] Performance : Optimisation des index et du partitionnement
- [ ] Documentation : Guides utilisateurs et techniques finaux
- [ ] Finalisation : Nettoyage et préparation au pilote
