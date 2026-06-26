markdown
# MuseTable - Agent Guide

## 📋 Vision Globale

MuseTable est architecturé autour du **mode Libre** comme cœur du projet :
- **Mode Libre** — manipulation libre des cartes et dés, sans règles. Le terrain de jeu universel.
- **Jeux** — extensions optionnelles qui ajoutent des règles (Blackjack, Tarot, Pyramide, Bizkit).

Chaque jeu est indépendant : son propre handler API, sa propre logique métier, ses propres contrôles frontend.
Le routeur (`api/index.js`) dispatch vers le bon handler selon le `gameType` de la salle.

### Structure modulaire

```
api/
├── index.js                 # Routeur : routes communes + dispatch
└── handlers/
    ├── free.js               # Mode Libre
    ├── blackjack.js           # Blackjack
    ├── tarot.js               # (à implémenter)
    ├── pyramide.js            # (à implémenter)
    └── bizkit.js              # (à implémenter)

game-logic/
├── common.js                 # Fonctions partagées (deck, dés, ID)
├── blackjack.js              # Règles Blackjack (score, tour, victoire)
└── free.js                   # Logique Libre (piocher, poser, dés)

public/
├── index.html                # Frontend SPA
└── js/
    ├── common.js             # Partagé (API, polling, navigation)
    ├── game-blackjack.js     # Rendu + contrôles Blackjack
    └── game-free.js          # Rendu + contrôles Libre
```

## 📋 Contexte
Table de jeu virtuelle cross-device. Une URL, sans installation, 1-10 joueurs sur mobiles/tablettes.

**Vision** : "T'as pas de cartes ? Utilise un paquet dématérialisé."

---

## 🎯 Jeux (Ordre)
1. **Blackjack** (MVP) - 1-6 joueurs, piocher/rester/doubler
2. **Tarot Africain** - 1-6 joueurs, atouts uniquement, paris tournants
3. **Pyramide** - 2-10 joueurs, cartes alcool
4. **Bizkit** - 2-10 joueurs, dés alcool (2 dés, 7 = BIZKIT)

---

## 🏗️ Stack Technique
| Élément | Choix |
|---------|-------|
| Frontend | HTML/CSS/JS (single page) |
| Backend | Node.js |
| Hébergement | Vercel (Plan Hobby) |
| Stockage | Mémoire (objet global) |
| Temps réel | Polling (2-3s) |

---

## 🎨 Interface
- **Mobile-first** (priorité)
- **Fullscreen** + **Mode anonymisé**
- **Vues** : Joueur (main privée) / Plateau (public)

---

## 🔧 Règles de Code
- Commentaires en **français**
- **Zéro dépendance** externe
- CSS natif, JS vanilla
- Cartes/Dés en CSS (design sobre)
- Routes RESTful, pas de BDD

### API Endpoints
POST /api/create-room
POST /api/join-room
POST /api/shuffle
POST /api/draw
POST /api/play-card
POST /api/roll-dice
GET /api/game-state

text

---

## 🧠 Approche
**Incrémental** → **Testable** → **Itératif**

### MVP Priorités
- [ ] Salle (code 4 chiffres)
- [ ] 1-10 joueurs
- [ ] Mélanger/Distribuer/Jouer
- [ ] Plateau public fullscreen
- [ ] Mode anonymisé

---

## 🤖 Agent IA
- quotas gratuis d'agents ia, économiser les tokens en entrée et sorties
- Génération progressive, un fichier à la fois

### Contraintes
- Pas de BDD/Redis/WebSockets
- Compatible Vercel serverless
- Performance mobile

---

## 📝 Checklist
**Phase 1** : Vercel + routes API + stockage mémoire + polling
**Phase 2** : Page unique + CSS mobile + vues (joueur/plateau)
**Phase 3** : Blackjack → Tarot → Pyramide → Bizkit
**Phase 4** : Animations + sons + historique

---

## 📌 Notes
- Bizkit : polling 2-3s suffisant
- Stockage : perdu au redémarrage (acceptable MVP)
- Vercel Hobby : largement suffisant

*Dernière mise à jour : 2026-06-22*