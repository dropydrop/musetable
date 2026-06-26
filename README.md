# 🎲 MuseTable

**Table de jeu virtuelle cross-device** — Remplacez votre jeu de cartes ou de dés physique par une simple URL !

Une table de jeu virtuelle où chaque joueur a sa "main" sur son propre écran (téléphone/tablette), et un écran central (ou un des joueurs en mode "spectateur plateau") affichant la vue commune.

---

## ✨ Fonctionnalités

- 🃏 **Jeux inclus** : Blackjack, Tarot Africain, Pyramide, Bizkit
- 📱 **Mobile-first** : Optimisé pour téléphones et tablettes
- 🔗 **Sans installation** : Une URL, tout le monde s'y connecte
- 👥 **1 à 10 joueurs** : Créez votre salle en 2 secondes
- 🎯 **Plateau public** : Vue fullscreen pour l'écran central
- 🙈 **Mode anonymisé** : Cachez les mains des joueurs
- 🔄 **Temps réel** : Polling toutes les 2-3 secondes

---

## 🚀 Pour Commencer

### Jouer

1. Ouvrez l'URL dans votre navigateur
2. Créez une salle (code à 4 chiffres)
3. Partagez le code avec vos amis
4. Choisissez votre rôle (joueur / plateau)
5. C'est parti !

### Installer (Développement)

```bash
git clone https://github.com/tonusername/musetable.git
cd musetable
npm start
```

---

## 🏗️ Architecture

| Élément | Technologie |
|---------|-------------|
| **Frontend** | HTML/CSS/JS (vanilla) |
| **Backend** | Node.js (routeur + handlers) |
| **Hébergement** | Vercel (Plan Hobby) |
| **Stockage** | Mémoire (objet global) |
| **Temps réel** | Polling (2-3s) |

### Structure

```
api/
├── index.js                   # Routeur (routes communes + dispatch)
└── handlers/
    ├── free.js                # Mode Libre
    ├── blackjack.js            # Blackjack
    ├── tarot.js                # (à implémenter)
    ├── pyramide.js             # (à implémenter)
    └── bizkit.js               # (à implémenter)

game-logic/
├── common.js                  # Fonctions partagées (deck, dés, ID)
├── blackjack.js               # Règles Blackjack
└── free.js                    # Logique Libre

public/
├── index.html                 # Frontend SPA
└── js/
    ├── common.js              # Partagé (API, polling, navigation)
    ├── game-blackjack.js      # Rendu + contrôles Blackjack
    └── game-free.js           # Rendu + contrôles Libre
```

---

## 🎮 Jeux Supportés

| Jeu | Type | Joueurs | Statut |
|-----|------|---------|--------|
| 🃏 Libre | Cartes/Dés | 1-10 | ✅ Fonctionnel |
| ♠ Blackjack | Cartes | 1-6 | ✅ Fonctionnel |
| 🎴 Tarot Africain | Cartes (atouts) | 1-6 | 📝 À implémenter |
| 🔺 Pyramide | Cartes (alcool) | 2-10 | 📝 À implémenter |
| 🎲 Bizkit | Dés (alcool) | 2-10 | 📝 À implémenter |

---

## 🔬 Tests

Tests unitaires avec le module natif `node:test` (Node.js 18+).

```bash
npm test
```

### Périmètre couvert

- **Logique métier** : calcul des scores Blackjack, création du paquet, gestion des tours, détection des gagnants
- **Mode Libre** : piocher/poser/retourner/reprendre des cartes, lancer dés, mélanger, distribuer
- **Routes API** : création/joindre/démarrer/piocher/rester/doubler/quitter/réinitialiser, validation des erreurs (400/404)

### Structure

```
tests/
└── unit/
    ├── game-logic.test.js   # Tests des fonctions pures (game-logic.js)
    ├── api.test.js          # Tests des routes API (mock req/res)
    └── free.test.js         # Tests du mode Libre
```

---

## 📦 Dépendances

- **Aucune** ! C'est du vanilla JavaScript, tout est inclus.

---

## 📝 Roadmap

- [x] Interface mobile-first
- [x] Création de salle (code 4 chiffres)
- [x] 1 à 10 joueurs
- [x] Mélanger/Distribuer/Jouer
- [x] Plateau public fullscreen
- [x] Mode anonymisé
- [x] Mode Libre (cartes + dés)
- [x] Blackjack (MVP)
- [x] Architecture modulaire (handlers + routeur)
- [ ] Tarot Africain
- [ ] Pyramide
- [ ] Bizkit
- [ ] Animations CSS
- [ ] Sons optionnels
- [ ] Historique des parties

---

## 📄 License

MIT — Faites-en ce que vous voulez !

---

*Dernière mise à jour : 2026-06-22*
