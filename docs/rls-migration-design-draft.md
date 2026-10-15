# Coaching VIP — conception de la migration RLS (BROUILLON, non exécutable)
Date : 2026-10-15
Branche Git : audit/security-hardening-2026-10-15

> Ce document est une spécification de travail, pas une migration SQL. Ne pas le copier dans Supabase SQL Editor ni l'appliquer en production.

## Objectif
Remplacer les politiques permissives existantes par un accès minimal basé sur l'identité authentifiée, le rôle attribué côté serveur et une relation coach-élève vérifiée. Les politiques RLS étant permissives par défaut, toutes les anciennes politiques qui ouvrent un accès trop large devront être supprimées ou réécrites ; ajouter une politique plus stricte à côté ne suffit pas.

## Matrice d'accès proposée — à valider sur les parcours réels

| Ressource | Client | Coach affecté | Administrateur |
| --- | --- | --- | --- |
| Profil | Lire/modifier ses données non sensibles ; ne pas changer son rôle | Lire les données nécessaires des élèves affectés ; ne pas changer leur rôle | Gestion administrative selon parcours existant |
| Programmes | Lire les programmes personnels/assignés ; créer ses séances personnelles ; pas modifier les programmes d'un coach | Créer, lire, modifier et supprimer les programmes des élèves affectés | Gestion administrative si l'interface l'exige |
| Exercices | Accéder seulement aux exercices de ses programmes | Gérer les exercices des programmes qu'il est autorisé à gérer | Gestion administrative si l'interface l'exige |
| Historique d'entraînement | Créer et consulter son propre historique | Lire les historiques des élèves affectés ; commenter/revoir si fonctionnalité existante | Gestion administrative si l'interface l'exige |
| Relations coach-élève | Demander une relation / accepter ou retirer selon un flux explicite | Accepter ou retirer selon un flux explicite ; pas s'auto-affecter sans consentement | Administration selon parcours existant |
| Demandes de coaching | Créer et lire ses demandes ; annuler ou modifier seulement dans les états autorisés | Lire et traiter les demandes qui lui sont adressées | Gestion administrative si l'interface l'exige |

## Constats techniques qui influencent la migration
- Les politiques actuelles de `programs`, `exercises` et `workout_logs` incluent plusieurs ouvertures globales (`USING (true)` / `WITH CHECK (true)`). Il faut examiner chaque politique existante et la remplacer, pas seulement en ajouter.
- Les identifiants de ces tables sont des UUID. `programs` contient `user_id`, `client_id`, `student_id` et `coach_id`, qui sont employés différemment selon les parcours actuels ; la migration ne doit pas présumer qu'ils sont interchangeables.
- `student_coaches` est la relation centrale d'affectation. Son flux de création et d'acceptation doit être compris avant de permettre INSERT/DELETE.
- Le formulaire d'inscription transmet le rôle choisi dans les métadonnées. Le rôle public par défaut doit devenir `client`, indépendamment des métadonnées fournies par le navigateur. Les rôles `coach` et `admin` doivent être attribués par un processus contrôlé.
- La fonction `delete_auth_user()` est attachée à un trigger sur suppression de profil. La fonction `handle_new_user()` est `SECURITY DEFINER`, mais aucun trigger portant son nom n'a été détecté dans les schémas non système interrogés ; vérifier les triggers de tous les schémas et son usage avant toute modification.
- Les colonnes sensibles de `profiles` ne peuvent pas être protégées en autorisant un simple UPDATE de toute la ligne. Préférer des mises à jour limitées aux colonnes autorisées et/ou une fonction contrôlée.
- La création et l'édition d'un programme et de ses exercices sont aujourd'hui faites en plusieurs requêtes. Prévoir ensuite une fonction transactionnelle pour éviter des données partielles.

## Tests obligatoires avant d'autoriser une fusion
1. Anonyme : aucune lecture ni écriture de profils, programmes, exercices, historiques ou relations privées.
2. Client A vs client B : aucune lecture/écriture des données privées de l'autre.
3. Client : ne peut pas s'attribuer un rôle coach/admin, ni ajouter un coach à une relation sans flux autorisé.
4. Coach non affecté vs coach affecté : seul le coach affecté accède aux données de l'élève.
5. Coach : ne peut pas forger `coach_id`, `student_id`, `client_id`, `user_id` ou l'auteur d'un historique pour agir sur les données d'autrui.
6. Admin : les permissions existantes sont conservées si l'application en dépend, sans ouvrir de privilèges au public.
7. Régression : inscription, connexion, demande/acceptation de coaching, création/édition/suppression de programme, exercices, enregistrement et lecture d'une séance, suppression de compte.
8. Le build Next.js et la preview Vercel réussissent avant toute fusion.

## Conditions de passage à l'implémentation
- Confirmer les parcours métier réels et la signification de chaque colonne d'affectation.
- Avoir une base de développement distincte de la production.
- Écrire la migration SQL versionnée, puis l'appliquer uniquement sur la base de développement.
- Tester avec des comptes de rôles différents et vérifier les refus d'accès aussi bien que les accès autorisés.
- Revoir les alertes de sécurité Supabase après migration.
- Aucune migration de production ni fusion vers `main` sans revue explicite des résultats.

## État
Brouillon de conception seulement. Aucun SQL n'a été exécuté pour modifier le schéma ou les politiques.
