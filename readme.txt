Fonctionnalités
---------------
-Liste des fonctionnalités implémentées: 

Inscription d'un utilisateur en respectant les critères sur le pseudo, le mail et le mot de passe
Connexion d'un utilisateur s'il adéjà un compte
Possibilité de passer de la page de connexion à celle d'inscription et inversement
Déconnexion possible à tout moment pour l'utilisateur une fois qu'il est connecté (bouton "déconnexion")

Ajout d'un lien avec sa description (bouton "partager un lien")
Suppression d'un lien qu'on a posté
Modification de la description d'un lien qu'on a posté
Visualisation d'un lien sur sa page avec ses votes ainsi que ses commentaires avec leurs votes

Ajout d'un upvote (flèche vers le haut) ou d'un downvote (flèche vers le bas) sur un commentaire ou un lien (bug un peu)
Possibilité de supprimer son vote ou de le changer pour le vote opposé
Visualisation de son vote (flèche blanche: pas de vote, flèche orange: vote)
Visualisation du nombre de votes de chaque commentaires et chaque lien

Ajout d'un commentaire sur un lien
Suppression d'un commentaire qu'on a posté

Page de profil pour chaque utilisateur (bouton "mon profil") où est affichée la totalité des liens, qu'a partagés l'utilisateur, ainsi que
leurs commentaires. L'affichage des liens et des commentaires se fait dans l'ordre anti-chronologique
 
Page d'accueil 

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


src/projet.js : description du fichier 2.