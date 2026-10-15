# Coaching VIP — audit sécurité et plan de correction
Date : 2026-10-15
Branche : audit/security-hardening-2026-10-15

## Périmètre inspecté
- Dépôt GitHub : `Juez34/coaching-vip`, branche `main`
- Projet Supabase : `zohyxxwjihvthsylhmuv`
- Projet Vercel : `coaching-vip`
- Inspection en lecture seule ; aucune donnée ni configuration de production modifiée.

## Constats confirmés

### Critique — politiques RLS trop permissives
Les tables `programs` et `exercises` ont des politiques `ALL` avec `USING (true)` et/ou `WITH CHECK (true)`, dont une qui inclut le rôle `anon`. Les politiques permissives s'additionnent : ajouter une politique restrictive sans retirer ou corriger celles-ci ne suffira pas.

La table `workout_logs` comporte des politiques de lecture avec `USING (true)` et d'insertion avec `WITH CHECK (true)` pour les utilisateurs authentifiés. Un utilisateur connecté peut donc potentiellement lire les historiques d'autres utilisateurs et créer des entrées non autorisées.

### Élevé — rôles auto-attribuables
Le formulaire `app/login/page.js` envoie le rôle choisi par l'utilisateur dans les métadonnées d'inscription puis tente de l'écrire dans `profiles`. La fonction `public.handle_new_user()` lit cette métadonnée comme rôle de profil. La politique d'update du profil autorise par ailleurs la modification de son propre enregistrement sans protection visible du champ `role`. L'accès coach/admin doit être attribué côté serveur par une procédure d'approbation contrôlée.

### Élevé — fonctions SECURITY DEFINER exécutables par les rôles publics
Les fonctions `public.handle_new_user()` et `public.delete_auth_user()` sont déclarées `SECURITY DEFINER` et leurs privilèges d'exécution incluent `anon` et `authenticated`. `handle_new_user` doit être appelée comme trigger, pas comme RPC publique. `delete_auth_user` est attachée à un trigger de suppression de profil. Restreindre leurs droits RPC sans casser leurs déclencheurs.

### Moyen — durcissement Auth / fonctions
L'audit Supabase signale un `search_path` mutable sur les deux fonctions et la protection contre les mots de passe compromis désactivée.

### Élevé — fichier SQL divergent du schéma réel
`supabase_schema.sql` prévoit notamment des IDs numériques pour `programs` et `exercises`, alors que la base connectée utilise des UUID. Ne pas exécuter ce fichier comme une migration sur la base existante.

## Plan de correction — à valider avant toute application
1. Établir les règles d'accès attendues pour les rôles client, coach et admin, y compris les relations coach-élève.
2. Préparer une migration versionnée qui retire les politiques permissives, remplace les politiques par des règles de moindre privilège, et protège les champs de rôle et d'affectation.
3. Restreindre les fonctions `SECURITY DEFINER` à leur usage nécessaire, fixer explicitement leur `search_path`, et vérifier que le trigger de suppression reste fonctionnel.
4. Modifier l'inscription pour qu'un compte public ne puisse pas s'attribuer le rôle coach/admin. Préserver le parcours coach avec une demande/approbation explicite plutôt qu'une promotion automatique.
5. Corriger l'édition d'un programme : le code actuel supprime les exercices puis les réinsère en plusieurs requêtes. Passer à une opération transactionnelle côté base pour éviter les programmes partiellement sauvegardés.
6. Tester sur une base de développement : accès anonyme, client A vs client B, coach assigné vs coach non assigné, admin, création/édition/suppression de programme, journal de séance, inscription et suppression de profil.
7. Exécuter le build et les tests sur une prévisualisation Vercel. Ne fusionner vers `main` ni appliquer de migration en production avant validation.

## État
Ce document ne change pas le comportement de l'application. Aucun correctif applicatif ou SQL n'a été appliqué à Supabase ou à la production Vercel.
