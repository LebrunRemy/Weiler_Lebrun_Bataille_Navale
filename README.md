## 🎯 Présentation

Bienvenue dans **Bataille Navale**, un projet de jeu interactif développé en **Angular** ! 🎯  

Ce jeu permet à l’utilisateur d’interagir avec une interface web pour jouer au célèbre jeu « Touché-Coulé ».

---

Ce projet implémente une version numérique du jeu **Bataille Navale**.

L'objectif est de placer stratégiquement des navires sur une grille puis de tenter de couler ceux de l’adversaire.

Le frontend est construit avec **Angular (TypeScript, HTML, CSS)** et offre une interface dynamique.

---

## 🎮 Écran d’accueil

<img width="1153" height="653" alt="image" src="https://github.com/user-attachments/assets/387954fa-8412-4ddb-851b-b045c3816d6e" />

L’écran principal permet de configurer rapidement une partie :

- Saisie du nom des deux joueurs  
- 🎲 Option pour jouer contre l’IA  
- ⚡ Mode rapide (grille 6x6)  
- ⏱️ Choix du temps par tour  
- 🕶️ Sélection du thème (mode sombre)  
- Bouton **“Commencer la bataille”**

L’interface est moderne, minimaliste et centrée sur l’expérience utilisateur.

---

## ⚓ Placement des navires

<img width="1080" height="611" alt="image" src="https://github.com/user-attachments/assets/da172025-0a8f-4a39-8383-7eeb6583e3c0" />

Une fois la partie lancée, chaque joueur accède à l’écran de placement :

- Glisser-déposer des navires sur la grille 10x10  
- Rotation des navires avec le bouton **“Pivoter”**  
- Placement aléatoire possible  
- Compteur de navires placés  
- Validation du placement  
- ⏱️ Timer actif pendant le placement  

### Navires disponibles :

- Porte-avions  
- Cuirassé  
- Croiseur  
- Sous-marin  
- Destroyer  

---

## 💥 Phase de tir

<img width="1080" height="611" alt="image" src="https://github.com/user-attachments/assets/1617369b-d2b6-4367-b60f-23d93a766265" />

Pendant la bataille :

- Affichage du joueur actif  
- Timer dynamique par tour  
- Statistiques en temps réel :
  - Nombre de tirs  
  - Touchés  
  - Manqués  
  - Précision (%)  
- Historique détaillé des actions  
- Indication visuelle :
  - ❌ = Touché  
  - ○ = Manqué  

Le système permet un suivi clair et stratégique de la partie.

---

## 📊 Historique & Statistiques

<img width="1080" height="611" alt="image" src="https://github.com/user-attachments/assets/53e7e367-7bc7-42c9-9033-f7a1f504b53c" />

Un panneau latéral affiche :

- Les dernières actions effectuées  
- Les navires coulés  
- Les coordonnées touchées  
- L’évolution de la partie  

Cela améliore l’aspect compétitif et stratégique du jeu.

---

## 🏆 Écran de victoire

<img width="1080" height="611" alt="image" src="https://github.com/user-attachments/assets/81a5511f-3390-443e-8e4c-cee7d983672a" />

À la fin de la partie, un écran récapitulatif s’affiche :

- 🎉 Nom du vainqueur  
- Statistiques complètes des deux joueurs :
  - Tirs  
  - Touchés  
  - Manqués  
  - Précision  
  - Nombre de navires coulés  
- Durée totale de la partie  
- Options :
  - Nouvelle partie  
  - Rejouer avec les mêmes noms  
