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

### Élevé — rôles auto-attribuables et champs de profil
Le formulaire `app/login/page.js` envoie le rôle choisi par l'utilisateur dans les métadonnées d'inscription puis tente de l'écrire dans `profiles`. La fonction `public.handle_new_user()` lit cette métadonnée comme rôle de profil. La politique d'update du profil autorise par ailleurs la modification de son propre enregistrement sans protection visible du champ `role`. L'accès coach/admin doit être attribué côté serveur par une procédure d'approbation contrôlée.

Le code d'inscription ne vérifie pas l'erreur renvoyée par le `upsert` du profil. Il peut donc afficher un succès alors que l'écriture du profil a échoué.

### Élevé — fonctions SECURITY DEFINER exécutables par les rôles publics
Les fonctions `public.handle_new_user()` et `public.delete_auth_user()` sont déclarées `SECURITY DEFINER` et leurs privilèges d'exécution incluent `anon` et `authenticated`. `delete_auth_user` est attachée à un trigger de suppression de profil. Aucun trigger `handle_new_user` n'a été trouvé dans les schémas non système inspectés : vérifier si cette fonction est encore utilisée avant de la modifier ou de la supprimer. Restreindre les droits RPC sans casser les déclencheurs.

### Élevé — affectation coach-élève insuffisamment protégée
La politique `student_coaches` autorise les opérations lorsqu'un utilisateur est soit l'élève, soit le coach de la ligne. Il faut vérifier les règles d'insertion et de suppression : dans sa forme actuelle, elle peut permettre à un utilisateur de s'ajouter comme coach d'un élève sans processus d'acceptation vérifié.

### Moyen — durcissement Auth / fonctions
L'audit Supabase signale un `search_path` mutable sur les deux fonctions et la protection contre les mots de passe compromis désactivée.

### Élevé — fichier SQL divergent du schéma réel
`supabase_schema.sql` prévoit notamment des IDs numériques pour `programs` et `exercises`, alors que la base connectée utilise des UUID. Ne pas exécuter ce fichier comme une migration sur la base existante. L'historique de migrations Supabase retourné est vide ; il faudra établir une stratégie de migrations versionnées avant de toucher au schéma.

### Élevé — écritures multi-requêtes non atomiques
La création de programme enregistre d'abord le programme, puis les exercices dans une requête séparée. L'édition change le titre, supprime les exercices, puis les réinsère séparément. En cas d'erreur au milieu, des données partielles ou une liste d'exercices vide peuvent rester. À déplacer vers une fonction SQL transactionnelle après sécurisation des permissions et tests.

## Plan de correction — à valider avant toute application
1. Établir les règles d'accès attendues pour les rôles client, coach et admin, y compris les relations coach-élève et les séances personnelles.
2. Préparer une migration versionnée qui retire les politiques permissives, remplace les politiques par des règles de moindre privilège, et protège les champs de rôle et d'affectation.
3. Restreindre les fonctions `SECURITY DEFINER` à leur usage nécessaire, fixer explicitement leur `search_path`, et vérifier que le trigger de suppression reste fonctionnel.
4. Modifier l'inscription pour qu'un compte public ne puisse pas s'attribuer le rôle coach/admin. Préserver le parcours coach avec une demande/approbation explicite plutôt qu'une promotion automatique.
5. Rendre les créations/modifications de programme atomiques avec une fonction transactionnelle côté base.
6. Tester sur une base de développement : accès anonyme, client A vs client B, coach assigné vs coach non assigné, admin, création/édition/suppression de programme, journal de séance, inscription et suppression de profil.
7. Exécuter le build et les tests sur une prévisualisation Vercel. Ne fusionner vers `main` ni appliquer de migration en production avant validation.

## État
Ce document ne change pas le comportement de l'application. Aucun correctif applicatif ou SQL n'a été appliqué à Supabase ou à la production Vercel.


## Audit complémentaire des accès UI
Une inspection complémentaire des pages d'accueil, coach, client et administration a relevé des contrôles de rôle manquants côté interface et une lecture globale des profils dans l'espace admin. Voir [l'audit complémentaire des contrôles d'accès](access-control-audit-2026-10-15.md). Ces contrôles d'interface ne remplacent pas les politiques RLS ; aucune correction applicative ou de base n'a été appliquée.
