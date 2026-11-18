# 🇩🇫 Santé Numérique Niger

[![CI](https://github.com/chamsoudine-dev/CSI/workflows/CI/badge.svg)](https://github.com/chamsoudine-dev/CSI/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Plateforme nationale de santé numérique pour le Niger

Une solution complète de système d'information sanitaire (SIS) pour remplacer les registres papier des Centres de Santé Intégrés (CSI), hôpitaux, districts sanitaires et directions régionales.

---

## 🎯 Fonctionnalités principales

- **Registre national des patients** : Identifiants uniques, détection de doublons, traçabilité nationale
- **Gestion des consultations** : Saisie, diagnostic CIM-10, suivi des évolutions
- **Programme de vaccination (PEV)** : Calendrier vaccinal, suivi des doses
- **Santé maternelle & infantile** : CPN, accouchements, CPON
- **Pharmacie & stocks** : Gestion des entrées/sorties, alertes de rupture
- **Laboratoire** : Prescriptions et résultats
- **Surveillance épidémiologique** : Alertes automatiques maladies obligatoires
- **Tableaux de bord** : Analytics par rôle (national, régional, agent)
- **Mode hors ligne** : PWA installable, IndexedDB, synchronisation automatique

---

## 🚀 Téléchargement & Installation

### Prérequis

- Node.js 20.x ou supérieur
- pnpm 9.x
- PostgreSQL 16+

### Installation

```bash
# Clonez le dépôt
git clone https://github.com/chamsoudine-dev/CSI.git
cd CSI

# Installez les dépendances
pnpm install

# Copiez les variables d'environnement
cp .env.example .env.local
# Configurez vos valeurs dans .env.local

# Lancez le serveur de développement
pnpm dev
```

### Accès

- Frontend : http://localhost:3000
- Database Studio : http://localhost:5173 (drizzle-kit)

---

## 🛠️ Commandes disponibles

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Démarrer le serveur de développement |
| `pnpm build` | Builder la production |
| `pnpm start` | Démarrer le serveur de production |
| `pnpm lint` | Vérifier le code (ESLint) |
| `pnpm typecheck` | Vérifier les types TypeScript |
| `pnpm db:push` | Appliquer les migrations (développement) |
| `pnpm db:migrate` | Générer et appliquer les migrations |
| `pnpm db:studio` | Ouvrir Drizzle Studio |
| `pnpm db:seed` | Exécuter le seed de test |
| `pnpm test` | Lancer les tests unitaires |
| `pnpm test:e2e` | Lancer les tests E2E Playwright |

---

## 🏗️ Architecture

### Stack technologique

- **Frontend** : Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Base de données** : PostgreSQL 16, Drizzle ORM, Row-Level Security
- **Auth** : NextAuth.js v5, Argon2id, TOTP 2FA
- **Hors-ligne** : PWA, Service Worker, IndexedDB
- **Tests** : Vitest, Playwright, Testcontainers (PostgreSQL)

### Structure des dossiers

```
src/
├── app/                    # Pages et API Routes (App Router)
│   ├── (auth)/             # Auth (login, register)
│   ├── (dashboard)/        # Dashboards par rôle
│   └── api/                # API Endpoints
├── components/             # Composants React réutilisables
├── lib/                    # Bibliothèques (db, utils, validation)
├── middleware.ts           # Middleware RLS + Auth
└── types/                  # Types TypeScript globaux
```

---

## 🔐 Sécurité

### Rôles et permissions

| Rôle | Accès |
|------|-------|
| ADMIN_NATIONAL | Accès total, gestion du système |
| SUPERVISEUR_NATIONAL | Lecture national, tableaux de bord |
| SUPERVISEUR_REGIONAL | Accès à sa région uniquement |
| AGENT_SANTE | Accès à sa formation sanitaire uniquement |

### Mesures de sécurité

- [x] Mots de passe Argon2id
- [x] Double facteur authentification (TOTP)
- [x] Verrouillage après échecs
- [x] Row-Level Security PostgreSQL
- [x] Chiffrement des champs sensibles (pgcrypto)
- [x] Journalisation des actions (audit)
- [x] Rate limiting API

---

## 📊 Base de données

### Schéma principal

![Schéma DB](docs/schema-db.png)

### Migrations

Les migrations sont versionnées dans le dossier `migrations/` et générées via `drizzle-kit`.

```bash
# Générer une migration
pnpm db:migrate

# Ou push mode développement
pnpm db:push
```

### Seed fictif

Des données géographiques et de test sont chargées via `scripts/seed.ts`.

---

## 🌍 Rôle administrateur national

Par défaut, l'utilisateur `admin@niger.gouv.ne` avec mot de passe `Admin@2024SecurePass` est créé en base. Changez-le immédiatement en production.

---

## 📋 Plan de livraison

| Phase | Objectif | Statut |
|-------|----------|--------|
| 0 | Audit & Architecture | ✅ |
| 1 | Auth, RLS, Base de données, Seed | 🚧 |
| 2 | Patients, Consultations, Offline | ⬜ |
| 3 | Vaccination, Maternelle, Pharmacie | ⬜ |
| 4 | Tableaux de bord, Rapports | ⬜ |
| 5 | Projets, Surveillance épi | ⬜ |
| 6 | Sécurité, Tests, Pilote | ⬜ |

---

## 📄 Documentation

- [Guide utilisateur](docs/user-guide.md) - Par rôle
- [Guide déploiement](docs/deployment.md) - Production
- [Schéma base de données](docs/schema-db.md) - Diagramme ERD
- [API Reference](docs/api-reference.md) - OpenAPI

---

## 🤝 Contribuer

1. Forknez le projet
2. Créez une branche feature (`git checkout -b feature/ma-nouvelle-fonctionnalite`)
3. Effectuez vos modifications
4. Lances les tests (`pnpm test`)
5. Committez (`git commit -m 'feat: Ma nouvelle fonctionnalité'`)
6. Push (`git push origin feature/ma-nouvelle-fonctionnalite`)
7. Ouvrez une Pull Request

---

## 📜 License

MIT License - Voir [LICENSE](LICENSE) pour plus de détails.

---

## 📞 Contact

**Ministère de la Santé Publique du Niger**

Plateforme Santé Numérique - 2024-2026