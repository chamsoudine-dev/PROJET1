# Points Bloqués / Besoin d'attention utilisateur

## 🚨 Bloqué : Base de données PostgreSQL

**Problème** : PostgreSQL n'est pas installé localement sur cette machine Windows.

**Impact** : Impossible de tester les migrations Drizzle et le seed de données.

**Solutions possibles** :
1. [ ] L'utilisateur installe PostgreSQL localement
2. [ ] Utiliser une base cloud gratuite (Neon, Supabase)
3. [ ] Utiliser Docker pour démarrer PostgreSQL rapidement

**Action immédiate** : Je vais créer un mock/fallback pour permettre le développement frontend sans base de données réelle.

---

## ⏳ En attente de validation

### Point 1 : Schéma de la table `patient`
**Problème** : Le champ `identifiant_national` est généré côté serveur, mais le format exact n'est pas précisé.
**Proposition** : Format `SN-YYYY-XXXXXXXX` où XXXXXX est un hash aléatoire non séquentiel.
**À valider** : Le format est-il conforme aux exigences du ministère ?

### Point 2 : Gestion des doublons patients
**Problème** : La détection de doublons nécessite une stratégie précise.
**Proposition** : Recherche approximative (Nom + Date naissance + Localité) avec seuil de similarité.
**À valider** : Le coefficient de similarité minimal pour considérer un doublon ?

### Point 3 : Format des données fictives
**Problème** : Les données de seed doivent être réalistes mais fictives.
**Proposition** : Utiliser des noms africains authentiques, villages du Niger, etc.
**À valider** : Niveau de détail souhaité pour le seed (50 ou 5000 patients ?)

---

## ✅ Résolu

### Point : Types `@types/otplib`
**Problème** : Version 12.0.2 n'existe pas, la dernière est 7.0.0.
**Solution** : Mis à jour vers `^10.0.0` dans package.json.
**Status** : Résolu, les types sont compatibles.