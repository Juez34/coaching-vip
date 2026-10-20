# Coaching VIP — corrections appliquées à la base de test

Date : 2026-10-16  
Projet Supabase : `zohyxxwjihvthsylhmuv`  
Branche GitHub de travail : `audit/security-hardening-2026-10-15`

## Périmètre

L'utilisateur a confirmé que la base Supabase actuelle est une base de test non utilisée et a autorisé sa modification. Les opérations ci-dessous ont été appliquées uniquement à ce projet Supabase. Aucun changement n'a été fusionné dans `main`, aucun déploiement Vercel de production n'a été déclenché et aucune branche Supabase payante n'a été créée.

## Modifications appliquées

Migrations enregistrées dans Supabase :

- `20261016080507_create_private_schema_for_security_helpers`
- `20261016080525_secure_privileged_auth_trigger_functions`
- `20261016080546_harden_rls_for_coaching_vip_tables`
- `20261016080554_restrict_coach_workout_log_updates`
- `20261016080626_fix_profile_privilege_guard_execution_context`
- `20261016080634_grant_private_helper_schema_usage`
- `20261016080644_fix_workout_log_guard_execution_context`

Corrections principales :

1. Remplacement des anciennes politiques RLS sur `profiles`, `programs`, `exercises`, `workout_logs`, `student_coaches` et `coaching_requests`. Les politiques permissives globales, dont celles qui accordaient un accès trop large à `anon`, ont été retirées.
2. Ajout de fonctions internes pour vérifier les rôles admin/coach et les relations coach-élève.
3. Restriction des fonctions privilégiées `handle_new_user()` et `delete_auth_user()` : `search_path` fixé et droit d'exécution RPC retiré aux rôles `anon` et `authenticated`. La fonction d'inscription ne lit plus le rôle depuis les métadonnées fournies par l'utilisateur et initialise les nouveaux profils en rôle `client`.
4. Ajout d'un garde-fou empêchant un utilisateur de modifier lui-même son rôle ou son coach associé.
5. Ajout d'un garde-fou empêchant un coach de modifier les données d'une séance élève : il ne peut changer que le champ `coach_reviewed`.
6. Création des politiques permettant aux élèves de voir leurs programmes et journaux, aux coaches de voir les éléments de leurs élèves associés et aux admins de gérer les comptes.

## Vérifications réalisées

- Les données sont restées présentes : **4 profils, 8 programmes, 15 exercices, 14 journaux d'entraînement, 2 relations coach-élève et 0 demande de coaching** avant et après les changements.
- Les rôles `anon` et `authenticated` ne peuvent plus appeler les fonctions privilégiées d'authentification.
- Le test SQL en rôle client a confirmé que l'utilisateur ne peut pas s'attribuer le rôle `admin`.
- Le test SQL a confirmé qu'un client ne peut pas créer lui-même une relation `student_coaches`.
- Le test SQL a confirmé qu'un coach ne peut pas modifier le commentaire de l'élève dans un journal d'entraînement.
- Le test SQL a confirmé qu'un coach peut modifier le champ `coach_reviewed`.
- Le rôle `anon` ne peut plus lire la table `programs` : accès refusé au niveau des privilèges.
- Les contrôles Supabase ne signalent plus les fonctions à `search_path` mutable ni les fonctions `SECURITY DEFINER` exécutables publiquement. L'alerte restante est la protection contre les mots de passe compromis désactivée.

## Limites et prochaine étape

- Ces tests ciblés ne remplacent pas une suite complète de non-régression ni des tests via l'API avec de vrais comptes.
- Le code applicatif n'est pas encore adapté aux nouvelles règles. En particulier, `app/login/page.js` propose encore une inscription coach et ignore l'erreur du `upsert` de profil. Il faut modifier ce parcours sur la branche de travail pour que les nouveaux comptes publics soient des élèves, gérer explicitement les erreurs, puis tester l'inscription et la connexion.
- Les pages coach/admin doivent vérifier les rôles et traiter les refus RLS proprement. Les vérifications côté interface ne remplacent pas la sécurité SQL.
- La protection contre les mots de passe compromis doit être activée dans les paramètres Auth Supabase si elle est disponible pour ce projet.
- Les migrations SQL doivent être versionnées dans le dépôt après avoir réconcilié l'historique Supabase existant. Ne pas exécuter `supabase_schema.sql` tel quel : il diverge du schéma réel, notamment sur les types d'identifiants.

**État final de cette étape :** base de test durcie, données préservées, vérifications ciblées réussies. Application non déployée et production non touchée.
