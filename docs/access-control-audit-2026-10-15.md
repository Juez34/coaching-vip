# Coaching VIP — audit complémentaire des parcours d'accès

Date : 2026-10-15
Branche : `audit/security-hardening-2026-10-15`

> Audit en lecture seule du code. Ce document ne contient pas de migration exécutable et ne modifie pas le comportement de l'application.

## Nouveaux constats confirmés dans le code

### Élevé — les pages de rôle ne contrôlent pas le rôle du compte

Les pages `app/admin/page.js` et `app/coach/page.js` vérifient qu'un utilisateur est connecté, mais ne vérifient pas que son profil porte respectivement le rôle `admin` ou `coach`. La page d'accueil et la connexion redirigent selon le rôle, mais une redirection côté client n'est pas une frontière de sécurité : un utilisateur peut tenter d'ouvrir directement l'URL d'un autre espace.

La correction ne doit pas reposer uniquement sur l'interface. Il faut :
1. protéger les données avec des politiques RLS correctes ;
2. ajouter un contrôle de rôle côté interface pour éviter d'afficher le mauvais espace ;
3. pour toute action privilégiée future côté serveur, vérifier le rôle côté serveur également.

### Élevé — l'administration lit tous les profils via le navigateur

`app/admin/page.js` appelle `profiles.select("*")` depuis le client et affiche les noms, emails, rôles et téléphones de tous les profils. La confidentialité doit donc être imposée par la base ; la page ne doit pas être considérée comme protégée par sa seule URL. La migration doit préserver la vue administrative attendue tout en refusant cet accès aux autres rôles.

### Moyen — récupération des profils insuffisamment contrôlée

Plusieurs pages ignorent l'erreur lors de la lecture du profil et peuvent continuer avec un profil absent. Le correctif devra gérer explicitement le profil absent, le rôle inconnu et l'erreur de lecture, sans attribuer de privilèges par défaut.

### Moyen — nettoyage global du stockage au logout

Les pages coach/admin appellent `localStorage.clear()` et `sessionStorage.clear()`. Cela supprime toutes les clés de stockage de l'origine, y compris celles d'autres fonctionnalités éventuelles. Préférer supprimer uniquement les clés appartenant à Coaching VIP, après avoir confirmé si l'application utilise réellement ces stockages.

## Contrat de non-régression

Avant de modifier les écrans, conserver et tester les parcours existants :
- inscription élève et connexion ;
- inscription / demande de compte coach, sans promotion privilégiée automatique ;
- redirection d'un compte authentifié selon son rôle réel ;
- accès coach à ses seuls élèves assignés ;
- accès élève à ses programmes et son propre historique ;
- accès administrateur aux fonctions d'administration existantes ;
- création, édition et suppression d'un programme avec ses exercices ;
- enregistrement et consultation d'une séance ;
- déconnexion et retour à l'écran de connexion.

## Plan de tests d'autorisation

| Scénario | Résultat attendu |
| --- | --- |
| Visiteur anonyme ouvre directement `/admin` ou `/coach` | Redirection vers connexion ; aucune donnée privée récupérable |
| Compte client ouvre `/admin` ou `/coach` directement | Refus côté interface et données refusées par RLS |
| Coach A tente de lire les profils / programmes de l'élève de Coach B | Refus |
| Client A tente de lire/modifier les données privées de Client B | Refus |
| Client modifie ses métadonnées Auth ou son profil pour devenir coach/admin | Le rôle privilégié n'est pas accordé |
| Client tente d'ajouter une relation coach-élève non autorisée | Refus |
| Coach affecté consulte l'élève qui lui est lié | Autorisé uniquement pour les données prévues |
| Admin consulte la liste des profils | Autorisé si le rôle admin a été attribué par un processus contrôlé |
| Création/édition d'un programme échoue pendant l'écriture des exercices | Pas de programme incomplet ni d'exercices supprimés partiellement |
| Profil manquant ou erreur de lecture du profil | Échec fermé, sans privilège par défaut |

## Ordre de travail recommandé

1. Cartographier les écrans et requêtes qui lisent/écrivent les six tables concernées.
2. Confirmer les règles métier exactes des relations coach-élève et des programmes personnels.
3. Préparer le correctif Auth et une migration RLS versionnée, sans l'exécuter.
4. Ajouter des tests ciblés des autorisations et des parcours de régression.
5. Exécuter les vérifications et le build dans une prévisualisation isolée.
6. N'envisager une migration de base ou une fusion vers `main` qu'après revue explicite des résultats.

## État

Aucun code applicatif n'a été modifié dans ce travail complémentaire. Aucune modification n'a été faite sur Supabase, Vercel ou la branche `main`.
