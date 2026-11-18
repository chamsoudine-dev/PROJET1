# Décisions prises - Santé Numérique Niger

## Décision 1 : Base de données
**Problème** : PostgreSQL non installé localement, impossible de tester les migrations.
**Solution** : Je vais créer une version de seed et de seed qui utilise une base SQLite temporaire pour tester le code, puis adapter pour PostgreSQL.

## Décision 2 : Architecture PWA/Hors-ligne
**Problème** : La synchronisation asynchrone nécessite un état bien défini.
**Solution** : Je vais utiliser `idb` (IndexedDB wrapper) pour le stockage local, et implémenter une file d'attente avec états : `pending`, `syncing`, `success`, `error`.

## Décision 3 : Validation côté client vs serveur
**Problème** : Double validation peut être répétitive.
**Solution** : Utiliser Zod côté serveur (schema partagés) etReact Hook Form côté client. Le serveur valide toujours.

## Décision 4 : RLS (Row-Level Security)
**Problème** : Injection du contexte utilisateur dans PostgreSQL.
**Solution** : Le middleware Next.js définit les variables `current_setting` via les headers HTTP. Le pool de connexions lit ces headers et exécute `SET LOCAL` avant chaque requête.

## Décision 5 : Tests de sécurité
**Problème** : Les tests RBAC nécessitent une base de données configurée.
**Solution** : Créer un setup de test avec Testcontainers (PostgreSQL Docker) ou utiliser une base SQLite en mémoire pour les tests unitaires.

## Décision 6 : Gestion des erreurs
**Problème** : Messages d'erreur doit être utiles mais ne pas exposer d'informations sensibles.
**Solution** : Logger les erreurs serveur dans un fichier, retourner des messages génériques au client. Utiliser Sentry pour la production.