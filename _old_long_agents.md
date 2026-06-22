\# agents.md - MuseTable


```markdown

\# MuseTable - Agent Development Guide



\## 📋 Contexte du Projet



\*\*MuseTable\*\* est une table de jeu virtuelle cross-device permettant de remplacer un jeu de cartes ou de dés physique. L'application est accessible via une simple URL, sans installation, et permet à 1 à 10 joueurs de jouer ensemble sur leurs téléphones/tablettes.



\*\*Vision\*\* : "T'as pas de paquet de cartes ? Pas grave, utilise un paquet dématérialisé."



\---



\## 🎯 Jeux à Implémenter (Ordre de Priorité)



\### 1. Blackjack (MVP)

\- 1 à 6 joueurs

\- Distribution automatique (2 cartes)

\- Actions : Piocher / Rester / Doubler

\- Calcul automatique du gagnant



\### 2. Tarot Africain

\- 1 à 6 joueurs

\- On garde uniquement les atouts

\- Pari sur le nombre de mains remportées

\- Excuse = 0 ou 22 (selon la règle choisie)

\- Ordre du pari tournant (comme le dealer)

\- Une seule carte par main



\### 3. Pyramide (Jeu de cartes alcool)

\- 2 à 10 joueurs

\- Mécanique de retournement de cartes

\- Règles à définir précisément



\### 4. Bizkit (Jeu de dés alcool)

\- 2 à 10 joueurs

\- 2 dés

\- Résultat instantané (7 = BIZKIT)

\- Tolérance de 2-3s pour l'affichage



\---



\## 🏗️ Architecture Technique



\### Stack

| Élément | Choix | Justification |

|---------|-------|---------------|

| \*\*Frontend\*\* | HTML/CSS/JS (single page) | Pas de framework, léger |

| \*\*Backend\*\* | Node.js | Compatible Vercel |

| \*\*Hébergement\*\* | Vercel (Plan Hobby) | Gratuit et suffisant |

| \*\*Stockage\*\* | Mémoire (objet global) | Pas de BDD, simple |

| \*\*Temps réel\*\* | Polling (2-3s) | Évite WebSockets, suffisant |



\### Structure des Données (Exemple)

```javascript

const games = {

&#x20; '1234': {

&#x20;   id: '1234',

&#x20;   players: {

&#x20;     'p1': { name: 'Joueur 1', hand: \[], score: 0 },

&#x20;     'p2': { name: 'Joueur 2', hand: \[], score: 0 }

&#x20;   },

&#x20;   deck: \[], // Pioche

&#x20;   table: \[], // Plateau public

&#x20;   currentTurn: 'p1',

&#x20;   phase: 'distribution', // distribution | jeu | fin

&#x20;   gameType: 'blackjack' // blackjack | tarot | pyramide | bizkit

&#x20; }

};

```



\---



\## 🎨 Interface Utilisateur



\### Design Principles

1\. \*\*Mobile-first\*\* : Optimisé pour téléphones (priorité)

2\. \*\*Epuré mais joli\*\* : CSS uniquement, sans images externes

3\. \*\*Fonctionnalités clés\*\* :

&#x20;  - Mode plein écran (fullscreen)

&#x20;  - Mode anonymisé (masquer les mains des joueurs)

&#x20;  - Vue joueur (main privée)

&#x20;  - Vue plateau (public)



\### Layout Types

| Vue | Description |

|-----|-------------|

| \*\*Joueur\*\* | Affiche sa main + plateau public |

| \*\*Plateau\*\* | Affiche uniquement le plateau (fullscreen) |

| \*\*Anonymisé\*\* | Plateau sans noms/mains visibles |



\---



\## 🔧 Règles de Codage



\### Général

\- Code commenté en \*\*français\*\*

\- Pas de dépendances externes (sauf nécessité absolue)

\- Responsive design (taille des cartes/dés adaptative)

\- Accessible (contrastes, tailles de texte)



\### Frontend

\- Une seule page HTML

\- CSS natif (pas de frameworks)

\- JavaScript vanilla (pas de librairies)

\- Cartes en CSS (design sobre)

\- Dés avec animation CSS



\### Backend

\- Routes RESTful

\- Pas de base de données

\- Stockage en mémoire (objet global)

\- Gestion des sessions avec code à 4 chiffres



\### API Endpoints

```

POST /api/create-room    → Créer une salle

POST /api/join-room      → Rejoindre une salle

POST /api/shuffle        → Mélanger la pioche

POST /api/draw           → Piocher une carte

POST /api/play-card      → Jouer une carte

POST /api/roll-dice      → Lancer les dés

GET  /api/game-state     → Récupérer l'état (polling)

```



\---



\## 🧠 Philosophie de Développement



\### Approche "Vibe Coding"

1\. \*\*Incrémental\*\* : Commencer par le strict minimum

2\. \*\*Testable\*\* : Fonctionnel après chaque ajout

3\. \*\*Itératif\*\* : Améliorer progressivement

4\. \*\*Feedback\*\* : Tester avec de vrais joueurs



\### Priorités MVP

1\. ✅ Création de salle (code 4 chiffres)

2\. ✅ 1 à 10 joueurs

3\. ✅ Mélanger la pioche

4\. ✅ Distribuer les cartes

5\. ✅ Jouer des cartes sur le plateau

6\. ✅ Plateau public (fullscreen)

7\. ✅ Mode anonymisé



\### Expansion Future

\- Ajout des règles spécifiques par jeu

\- Sons et animations

\- Historique des parties

\- Statistiques



\---



\## 🤖 Recommandations pour l'Agent IA



\### Configuration

\- \*\*Agent local\*\* (Ollama + DeepSeek Coder V2 / Qwen 2.5 Coder)

\- Pas de quotas à gérer

\- Contexte suffisant pour le projet complet



\### Méthodologie

1\. \*\*Génération progressive\*\* : Un fichier à la fois

2\. \*\*Explications claires\*\* : Commenter chaque fonction

3\. \*\*Tests intégrés\*\* : Vérifier les cas limites

4\. \*\*Feedback utilisateur\*\* : Adapter selon les retours



\### Contraintes

\- Pas de BDD/Redis/WebSockets

\- Pas de dépendances externes

\- Compatible Vercel (serverless)

\- Performance sur mobile



\---



\## 📝 Checklist de Développement



\### Phase 1 : Infrastructure

\- \[ ] Créer projet Vercel

\- \[ ] Configurer routes API

\- \[ ] Implémenter stockage mémoire

\- \[ ] Système de polling



\### Phase 2 : Interface

\- \[ ] Page HTML unique

\- \[ ] CSS mobile-first

\- \[ ] Vue joueur

\- \[ ] Vue plateau (fullscreen)

\- \[ ] Mode anonymisé



\### Phase 3 : Jeux

\- \[ ] Blackjack (MVP)

\- \[ ] Tarot Africain

\- \[ ] Pyramide

\- \[ ] Bizkit



\### Phase 4 : Améliorations

\- \[ ] Animations CSS

\- \[ ] Sons (optionnels)

\- \[ ] Historique

\- \[ ] Statistiques



\---



\## 🔗 Liens Utiles



\- \*\*Hébergement\*\* : \[Vercel](https://vercel.com)

\- \*\*Agent IA\*\* : \[Ollama](https://ollama.com) + DeepSeek Coder V2

\- \*\*Design\*\* : Mobile-first, CSS pur

\- \*\*Inspiration\*\* : Jeux de cartes/dés physiques



\---



\## 📌 Notes Importantes



1\. \*\*Bizkit\*\* : Le polling à 2-3s est suffisant (pas de désavantage)

2\. \*\*Stockage\*\* : Les données sont perdues au redémarrage (acceptable pour MVP)

3\. \*\*Agents\*\* : Utiliser un agent local pour éviter les quotas

4\. \*\*Vercel\*\* : Le plan Hobby est largement suffisant pour ce projet



\---



\*Dernière mise à jour : 2026-06-22\*
