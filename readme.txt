Fonctionnalités
---------------
-Liste des fonctionnalités implémentées: 

Inscription d'un utilisateur en respectant les critères sur le pseudo, le mail et le mot de passe
Connexion d'un utilisateur s'il a déjà un compte
Possibilité de passer de la page de connexion à celle d'inscription et inversement
Déconnexion possible à tout moment pour l'utilisateur une fois qu'il est connecté (bouton "déconnexion" en position fixé)

Ajout d'un lien avec sa description (bouton "partager un lien")
Suppression d'un lien que l'on a posté
Suppression des commentaires postés sur un lien qu'on a partagé (même ceux des autres car c'est notre lien donc on a le droit)
Modification de la description d'un lien qu'on a posté
Visualisation d'un lien sur sa page avec ses votes ainsi que ses commentaires avec leurs votes

Ajout d'un upvote (flèche vers le haut) ou d'un downvote (flèche vers le bas) sur un commentaire ou un lien (bug un peu)
Possibilité de supprimer son vote ou de le changer pour le vote opposé
Visualisation de son vote (flèche blanche: pas de vote, flèche orange: vote)
Visualisation du nombre de votes de chaque commentaires et chaque lien

Ajout d'un commentaire sur un lien
Suppression d'un commentaire qu'on a posté sur un lien

Page de profil: 

Pour chaque utilisateur (bouton "mon profil") est affiché la totalité des liens qu'il a partagé, ainsi que
leurs commentaires. L'affichage des liens et des commentaires se fait dans l'ordre anti-chronologique
Puis affichage des liens et commentaires des liens, que l'utilisateur a voté ou commenté (ces liens ne font pas apparaître les liens
partagés par l'utilisateur qu'il a lui même voté ou commenté).
 
Page d'accueil: 

Colonne de gauche:
Tendances 24 heures, avec les liens possédant le plus d'interactions (nombre de upvote + commentaires), maximum 10 dans cette colonne
Tendances All-time, même chose, maximum 10 également

Colonne de droite :
Date de dernière connexion de l'utilisateur : OK
Tableaux avec toutes les nouveautés : OK
Affichage des nouveautés sur les posts avec lesquels on avait intéragit : OK
Séparation en 2 type de nouveautés, votes et commentaires.

-Liste des fonctionnalités non implémentées:

Bonus

Architecture
------------
src/views/projet.jade : 

Contient la totalité du layout. 
Séparable en 2 parties (indiquées avec du commentaire): 
1)Quand on est connecté:
Contient le code pour:
-La page d'accueil
-La page de profil
-La page d'un lien
-La déconnexion
Le passage entre les 3 différentes pages se fait grâce à la variable "sujet".
Pour chaque page le code se ressemble: des "each" sur les données à afficher dans la dite page.
Du commentaire tout au long du fichier permet de se repérer et de savoir la fonction de certains blocs de code.


2)Quand on est déconnecté:
Contient le code pour:
-L'inscription
-La connexion
Le passage entre ces 2 options se fait grâce à la variable "inscription".


src/projet.js : 

Le "/" permet de gérer à la fois la page d'accueil, la page de profil et les pages de liens. Ceci le rend très imposant (nombreuses 
variables, nombreuses requêtes et nombreux for pour modeler la data ou respecter les critères).

Le "/login" permet de gérer la connexion d'un utilisateur ayant déjà un compte en vérifiant les identifiants rentrés.

Le "/disconnect" permet de gérer la déconnexion d'un utilisateur qaund il est connecté.

Les "/register" permettent de gérer l'inscription d'un utilisateur en vérifiant que les infos données par celui-ci respectent les
critères du site.

Les "/edit" permettent de gérer la suppresion d'un commentaire ou d'un lien par l'utilisateur qu'il l'a posté; mais également de 
changer la description d'un lien que l'utilisateur a posté. A noter que cela peut aussi permettre à un utilisateur de supprimer
des commentaires d'autres utilisateurs sur des liens qu'il a partagé.

Le "/vote" permet (en théorie) de gérer l'affichage et le nombre de votes de tous le sliens et commentaires du site. Il permet 
d'afficher seulement une flèche orange ou blanche (pour les upvotes et les dowvotes) et empêche les utilisateurs de upvoter et 
downvoter.

Le "/add_link" permet de partager un lien en vérifiant que le lien partagé est bien un lien et qu'il est partagé avec une 
description.

Le "/add_comment" permet de poster un commentaire sur tous les liens du site quand on est sur la page du lien en question. 