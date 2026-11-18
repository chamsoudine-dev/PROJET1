# Leçons apprises & Bonnes pratiques

## Règle 1 : Installation de dépendances sur Windows
Sur Windows, l'installation de dépendances natives (comme argon2) peut échouer sans les outils de build Visual Studio. Toujours vérifier la disponibilité de `node-gyp` ou utiliser des versions pré-buildées (`@node-rs/argon2`).

## Règle 2 : PWA et App Router
La configuration PWA avec `next-pwa` nécessite une attention particulière avec l'App Router de Next.js 14/15. S'assurer que `sw.js` est correctement servi et que `manifest.json` est lié dans le layout racine.

## Règle 3 : Drizzle ORM et PostgreSQL 16
Le mode partitionné de PostgreSQL nécessite des configurations spécifiques dans Drizzle. Toujours utiliser `PARTITION BY RANGE` directement via `sql` si Drizzle-kit ne le supporte pas nativement pour le type de partition.

## Règle 4 : Accessibilité mobile
Pour les agents de santé sur le terrain, utiliser des boutons larges (min 44px), des contrastes élevés et des formulaires optimisés pour la saisie clavier (type d'input correct : `tel`, `date`, `number`).

## Règle 5 : Synchronisation hors ligne
Toujours enregistrer l'heure locale de l'appareil ET l'heure de réception serveur pour résoudre les conflits de synchronisation asynchrone (Last-Write-Wins avec audit).

## Règle 6 : Langue
L'interface doit être en Français par défaut, mais les schémas de données doivent prévoir les champs localisés (`nom_haoussa`, `nom_zarma`) pour une adoption maximale dans les régions rurales.
