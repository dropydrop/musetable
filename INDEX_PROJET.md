## INDEX_PROJET.md — MuseTable

**Dossiers des plugins disponibles dans :** `C:\Users\Pierre\Documents\GitHub\temp\agents\plugins`

---

## 🎯 Contexte du projet

**Application de table de jeu virtuelle cross-device (Vanilla JS/Node.js)** avec :

**Stack technique :**
- Frontend : HTML/CSS/JS pur (aucun framework)
- Backend : Node.js sur Vercel (serverless)
- Stockage : Mémoire (objet global)
- Temps réel : Polling (2-3s)
- Hébergement : Vercel (Plan Hobby)
- Architecture : Monorepo simple (`api/index.js` + `index.html`)

**Fonctionnalités clés :**
- Création de salle (code 4 chiffres)
- 1 à 10 joueurs
- Jeux : Blackjack, Tarot Africain, Pyramide, Bizkit
- Plateau public fullscreen
- Mode anonymisé
- Cartes en CSS pur (sans images)
- Mobile-first

---

## 📋 Agents retenus

---

### ACCESSIBILITY-COMPLIANCE

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/ui-visual-validator.md** | ➜ Déclencher après chaque modification UI majeure (cartes, dés, contrôleurs) pour vérifier contraste, focus, et interactions tactiles | `accessibility-compliance/agents/ui-visual-validator.md` |
| **commands/accessibility-audit.md** | ➜ Utiliser avant une revue de code pour valider la conformité WCAG 2.1 AA (contraste des cartes, taille des cibles tactiles) | `accessibility-compliance/commands/accessibility-audit.md` |
| **skills/screen-reader-testing/SKILL.md** | ➜ Appliquer lors des tests sur mobile pour valider l'accessibilité (annonce des cartes, scores, tour) | `accessibility-compliance/skills/screen-reader-testing/SKILL.md` |

---

### APPLICATION-PERFORMANCE

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/frontend-developer.md** | ➜ Déclencher pour toute optimisation de rendu, gestion du DOM (rafraîchissement des cartes, animations) | `application-performance/agents/frontend-developer.md` |
| **commands/performance-optimization.md** | ➜ Lancer après avoir ajouté une nouvelle fonctionnalité pour valider le maintien de 60fps (polling, rendu des cartes) | `application-performance/commands/performance-optimization.md` |

---

### BACKEND-DEVELOPMENT

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/backend-architect.md** | ➜ Utiliser pour structurer les routes API, la logique métier (Blackjack, Tarot, Pyramide, Bizkit) | `backend-development/agents/backend-architect.md` |
| **agents/test-automator.md** | ➜ Utiliser pour générer des tests automatisés des routes API (mock des appels) | `backend-development/agents/test-automator.md` |
| **skills/api-design-principles/SKILL.md** | ➜ Utiliser pour valider la conception des endpoints REST (cohérence, nommage) | `backend-development/skills/api-design-principles/SKILL.md` |
| **skills/error-handling-patterns/SKILL.md** | ➜ Utiliser pour standardiser la gestion des erreurs (404, 400, 500) | `backend-development/skills/error-handling-patterns/SKILL.md` |

---

### CICD-AUTOMATION

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/deployment-engineer.md** | ➜ Utiliser pour configurer le déploiement Vercel (`api/index.js` + `index.html`) | `cicd-automation/agents/deployment-engineer.md` |
| **commands/workflow-automate.md** | ➜ Utiliser pour automatiser les tests de validation avant déploiement (validation du code, lint) | `cicd-automation/commands/workflow-automate.md` |

---

### CODE-REFACTORING

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/code-reviewer.md** | ➜ Utiliser avant chaque refactoring pour identifier les opportunités de simplification (gestion des jeux, routes API) | `code-refactoring/agents/code-reviewer.md` |
| **agents/legacy-modernizer.md** | ➜ Utiliser pour maintenir la codebase propre et modulaire lors de l'ajout de nouveaux jeux | `code-refactoring/agents/legacy-modernizer.md` |
| **commands/tech-debt.md** | ➜ Lancer périodiquement pour évaluer la dette technique (logique métier des jeux, gestion des sessions) | `code-refactoring/commands/tech-debt.md` |
| **commands/refactor-clean.md** | ➜ Utiliser avant d'ajouter un nouveau jeu pour nettoyer le code existant | `code-refactoring/commands/refactor-clean.md` |

---

### CODEBASE-CLEANUP

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/code-reviewer.md** | ➜ Utiliser pour identifier les fonctions mortes, variables inutilisées, et code redondant | `codebase-cleanup/agents/code-reviewer.md` |
| **commands/deps-audit.md** | ➜ Utiliser pour vérifier les dépendances (aucune en théorie, mais vérifier) | `codebase-cleanup/commands/deps-audit.md` |

---

### COMPREHENSIVE-REVIEW

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/code-reviewer.md** | ➜ Utiliser pour les revues de code approfondies avant l'ajout d'un nouveau jeu majeur | `comprehensive-review/agents/code-reviewer.md` |
| **commands/full-review.md** | ➜ Lancer avant chaque release majeure pour valider l'ensemble du code, l'UI, et les performances | `comprehensive-review/commands/full-review.md` |

---

### CONTEXT-MANAGEMENT

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/context-manager.md** | ➜ Utiliser pour maintenir le contexte de session (salle, joueur, état du jeu) | `context-management/agents/context-manager.md` |
| **commands/context-save.md** | ➜ Déclencher pour sauvegarder l'état de la session (facultatif, dépend du jeu) | `context-management/commands/context-save.md` |
| **commands/context-restore.md** | ➜ Utiliser pour restaurer une session précédente (si stockée) | `context-management/commands/context-restore.md` |

---

### DEBUGGING-TOOLKIT

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/debugger.md** | ➜ Déclencher à chaque bug API, erreur de parsing des données, ou problème de rendu (polling, cartes) | `debugging-toolkit/agents/debugger.md` |
| **commands/smart-debug.md** | ➜ Utiliser pour diagnostiquer les problèmes complexes (désynchronisation, erreurs de tour, incohérence des mains) | `debugging-toolkit/commands/smart-debug.md` |
| **agents/dx-optimizer.md** | ➜ Utiliser pour améliorer l'expérience développeur (messages d'erreur clairs, feedback utilisateur) | `debugging-toolkit/agents/dx-optimizer.md` |

---

### DOCUMENTATION-GENERATION

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/mermaid-expert.md** | ➜ Utiliser pour générer des diagrammes d'architecture (flux des données, interactions joueur/serveur, cycles de jeu) | `documentation-generation/agents/mermaid-expert.md` |
| **agents/reference-builder.md** | ➜ Utiliser pour maintenir la documentation des APIs (endpoints, structure des données) | `documentation-generation/agents/reference-builder.md` |
| **skills/architecture-decision-records/SKILL.md** | ➜ Utiliser pour documenter les décisions techniques importantes (ex: pourquoi polling vs WebSockets, pourquoi stockage mémoire) | `documentation-generation/skills/architecture-decision-records/SKILL.md` |
| **skills/changelog-automation/SKILL.md** | ➜ Utiliser pour générer automatiquement le CHANGELOG entre les versions (ajout de jeux, nouvelles fonctionnalités) | `documentation-generation/skills/changelog-automation/SKILL.md` |

---

### ERROR-DEBUGGING

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/debugger.md** | ➜ Déclencher pour toute erreur JavaScript non capturée, surtout dans les appels API ou le traitement des données (polling, calcul des scores) | `error-debugging/agents/debugger.md` |
| **agents/error-detective.md** | ➜ Utiliser pour les erreurs intermittentes (désynchronisation, double-hit, stand bloqué) | `error-debugging/agents/error-detective.md` |
| **commands/error-analysis.md** | ➜ Utiliser pour analyser les erreurs dans la console ou les comportements inattendus (salle corrompue, joueur en double) | `error-debugging/commands/error-analysis.md` |
| **commands/error-trace.md** | ➜ Utiliser pour tracer la propagation d'une erreur (de l'appel API à l'affichage de la carte) | `error-debugging/commands/error-trace.md` |

---

### FRONTEND-MOBILE-DEVELOPMENT

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/frontend-developer.md** | ➜ Déclencher pour tout développement UI, surtout responsive et tactile (cartes, dés, contrôles) | `frontend-mobile-development/agents/frontend-developer.md` |
| **agents/mobile-developer.md** | ➜ Utiliser pour les adaptations spécifiques mobiles (touch events, viewport, gestes tactiles, safe-area) | `frontend-mobile-development/agents/mobile-developer.md` |
| **commands/component-scaffold.md** | ➜ Utiliser pour créer de nouveaux composants UI réutilisables (ex: nouvelle carte, dés, sélecteur de jeu) | `frontend-mobile-development/commands/component-scaffold.md` |
| **skills/responsive-design/SKILL.md** | ➜ Utiliser pour valider et améliorer le responsive (mobile, tablette, desktop) | `frontend-mobile-development/skills/responsive-design/SKILL.md` |

---

### FRONTEND-MOBILE-SECURITY

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/frontend-developer.md** | ➜ Utiliser pour valider la sécurité du code (pas de XSS dans les templates dynamiques, sanitization des noms de joueurs) | `frontend-mobile-security/agents/frontend-developer.md` |
| **agents/frontend-security-coder.md** | ➜ Utiliser pour valider les pratiques de sécurité frontend (CSP, sanitization des inputs) | `frontend-mobile-security/agents/frontend-security-coder.md` |
| **commands/xss-scan.md** | ➜ Lancer après l'ajout d'une nouvelle UI interactive (inputs de salle, pseudo) pour vérifier l'absence de XSS | `frontend-mobile-security/commands/xss-scan.md` |

---

### GIT-PR-WORKFLOWS

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/code-reviewer.md** | ➜ Utiliser pour les revues de code avant chaque merge de feature branch (ajout de jeu, bugfix) | `git-pr-workflows/agents/code-reviewer.md` |
| **commands/pr-enhance.md** | ➜ Utiliser pour améliorer automatiquement les PR (formatage, messages de commit) | `git-pr-workflows/commands/pr-enhance.md` |
| **commands/git-workflow.md** | ➜ Utiliser pour gérer les workflows Git (branches, tags de version) | `git-pr-workflows/commands/git-workflow.md` |

---

### JAVASCRIPT-TYPESCRIPT

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/javascript-pro.md** | ➜ Utiliser pour tout développement JavaScript, validation des bonnes pratiques ES6+, gestion des APIs asynchrones, gestion des erreurs | `javascript-typescript/agents/javascript-pro.md` |
| **skills/javascript-testing-patterns/SKILL.md** | ➜ Utiliser pour maintenir des tests (manuels ou automatisés) pour les appels API, la logique de jeu, le calcul des scores | `javascript-typescript/skills/javascript-testing-patterns/SKILL.md` |
| **skills/modern-javascript-patterns/SKILL.md** | ➜ Utiliser pour moderniser le code existant (map, filter, reduce, destructuring, async/await) | `javascript-typescript/skills/modern-javascript-patterns/SKILL.md` |

---

### OBSERVABILITY-MONITORING

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/performance-engineer.md** | ➜ Utiliser pour analyser les performances du polling, des appels API et du rendu des cartes | `observability-monitoring/agents/performance-engineer.md` |
| **agents/observability-engineer.md** | ➜ Utiliser pour mettre en place du logging (erreurs API, temps de réponse, désynchronisation) | `observability-monitoring/agents/observability-engineer.md` |

---

### SECURITY-COMPLIANCE

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/security-auditor.md** | ➜ Utiliser pour valider la sécurité du code (CSP, XSS, injections, stockage local) | `security-compliance/agents/security-auditor.md` |
| **commands/compliance-check.md** | ➜ Lancer pour vérifier la conformité RGPD (pas de données personnelles, salle éphémère) | `security-compliance/commands/compliance-check.md` |

---

### TDD-WORKFLOWS

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/tdd-orchestrator.md** | ➜ Utiliser pour structurer le développement des nouvelles fonctionnalités (Red → Green → Refactor) | `tdd-workflows/agents/tdd-orchestrator.md` |
| **commands/tdd-cycle.md** | ➜ Déclencher pour exécuter un cycle TDD complet lors de l'ajout d'un nouveau jeu (ex: Tarot, Pyramide, Bizkit) | `tdd-workflows/commands/tdd-cycle.md` |
| **commands/tdd-red.md** | ➜ Utiliser pour écrire les tests avant l'implémentation (cas d'usage : logique de Tarot, calcul des scores, paris) | `tdd-workflows/commands/tdd-red.md` |
| **commands/tdd-green.md** | ➜ Utiliser pour implémenter la fonctionnalité et passer les tests | `tdd-workflows/commands/tdd-green.md` |
| **commands/tdd-refactor.md** | ➜ Utiliser après validation des tests pour refactorer le code | `tdd-workflows/commands/tdd-refactor.md` |

---

### TEAM-COLLABORATION

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **commands/issue.md** | ➜ Utiliser pour créer des tickets de suivi (bugs, features, améliorations) lors du développement | `team-collaboration/commands/issue.md` |
| **commands/standup-notes.md** | ➜ Utiliser pour générer un résumé des avancées pour les daily meetings | `team-collaboration/commands/standup-notes.md` |

---

### UI-DESIGN

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/accessibility-expert.md** | ➜ Utiliser pour valider l'accessibilité des composants UI (contraste des cartes, taille des cibles tactiles, navigation) | `ui-design/agents/accessibility-expert.md` |
| **agents/design-system-architect.md** | ➜ Utiliser pour maintenir la cohérence du design system (couleurs, typographie, espacements) | `ui-design/agents/design-system-architect.md` |
| **agents/ui-designer.md** | ➜ Déclencher pour toute création ou modification UI (cartes, dés, écrans, contrôles) | `ui-design/agents/ui-designer.md` |
| **commands/accessibility-audit.md** | ➜ Utiliser pour un audit complet de l'accessibilité de l'interface (contraste, focus, navigation clavier) | `ui-design/commands/accessibility-audit.md` |
| **commands/design-review.md** | ➜ Lancer avant chaque release majeure pour valider la cohérence visuelle de l'interface | `ui-design/commands/design-review.md` |
| **commands/create-component.md** | ➜ Utiliser pour créer de nouveaux composants UI (ex: nouvelle carte, dés, sélecteur de jeu) | `ui-design/commands/create-component.md` |
| **commands/design-system-setup.md** | ➜ Utiliser pour configurer le design system (couleurs, typographie, espacements, animations) | `ui-design/commands/design-system-setup.md` |
| **skills/design-system-patterns/SKILL.md** | ➜ Utiliser pour maintenir la cohérence des composants UI (cartes, boutons, écrans) | `ui-design/skills/design-system-patterns/SKILL.md` |
| **skills/interaction-design/SKILL.md** | ➜ Utiliser pour concevoir les interactions (feedback visuel, animations de chargement, transitions) | `ui-design/skills/interaction-design/SKILL.md` |
| **skills/responsive-design/SKILL.md** | ➜ Utiliser pour valider et améliorer le responsive (mobile, tablette, desktop) | `ui-design/skills/responsive-design/SKILL.md` |
| **skills/visual-design-foundations/SKILL.md** | ➜ Utiliser pour les fondamentaux du design (couleurs, typographie, espacements) | `ui-design/skills/visual-design-foundations/SKILL.md` |
| **skills/web-component-design/SKILL.md** | ➜ Utiliser pour concevoir des composants UI réutilisables et modulables | `ui-design/skills/web-component-design/SKILL.md` |

---

### UNIT-TESTING

| Plugin | Règle de déclenchement locale | Chemin |
|:---|:---|:---|
| **agents/debugger.md** | ➜ Utiliser pour déboguer les tests qui échouent (logique de jeu, calcul des scores, gestion des tours) | `unit-testing/agents/debugger.md` |
| **agents/test-automator.md** | ➜ Utiliser pour automatiser les tests (appels API mockés, validation des données, logique des jeux) | `unit-testing/agents/test-automator.md` |
| **commands/test-generate.md** | ➜ Utiliser pour générer des tests unitaires pour les fonctions clés (calcul des scores, gestion des paris, distribution) | `unit-testing/commands/test-generate.md` |

---

## 🚫 Plugins explicitement exclus

| Type | Raison |
|:---|:---|
| **Base de données** | Pas de SGBD, stockage mémoire uniquement |
| **Cloud / Infrastructure avancée** | Pas de déploiement conteneurisé (Terraform, Kubernetes, Docker). Déploiement simple sur Vercel uniquement |
| **Blockchain, Data Engineering, Machine Learning, Quant, Reverse Engineering** | Hors domaine fonctionnel |
| **SEO, Marketing, RH, Légal, Ventes** | Projet de jeu, pas de site commercial |
| **Langages absents** | Python (Django, FastAPI), C#, Java, Scala, Go, Rust, C, C++, Elixir, Haskell, Julia, PHP, Ruby |
| **Orchestration d'agents** | Plugin-eval, Conductor, Ship-Mate, Agent-teams — pas adapté à la taille du projet |
| **API Documentation** | `api-documenter` — projet déjà documenté par un `README.md` et un `agents.md`, éviter la sur-documentation |
| **Performance Testing** | Pas de tests de charge nécessaires |
| **Payment Processing** | Pas de système de paiement |
| **Social Publishing** | Pas de publication sur les réseaux sociaux |
| **Database Migrations** | Pas de migrations SQL nécessaires |
| **Service Mesh** | Pas de microservices |
| **Reverse Engineering** | Pas d'analyse de binaires |
| **Framework Migration** | Pas de migration de framework (vanilla JS/Node.js) |
| **C4 Architecture** | Pas de diagramme C4 pour ce projet (trop petit) |
| **Kubernetes Operations** | Pas de déploiement Kubernetes |
| **LLM / Application IA** | Pas de LLM dans le projet |
| **Quantitative Trading** | Hors sujet |
| **Game Development (Unity, Minecraft)** | Pas de jeux vidéo, jeu de cartes/dés classique |

---

## 📁 Structure suggérée du projet

```
musetable/
├── api/
│   └── index.js                # Backend Node.js (routes API, logique des jeux)
├── public/                     # ou a la racine comme actuellement car l'utilisateur préfère
│   └── index.html              # Frontend (SPA Vanilla JS/CSS)
├── docs/
│   ├── ADR/                    # Architecture Decision Records
│   ├── API.md                  # Documentation des endpoints
│   └── CHANGELOG.md            # Historique des versions
├── tests/
│   └── unit/                   # Tests unitaires (logique des jeux, routes API)
├── agents.md                   # Guide de développement pour l'IA
├── README.md                   # Présentation du projet
├── package.json                # Métadonnées Node.js (Vercel)
└── vercel.json                 # Configuration Vercel
```

---

## 🔧 Règles d'utilisation des plugins

1. **Déclencher au bon moment** : Chaque plugin a une règle de déclenchement locale spécifique. Consulter la colonne "Règle de déclenchement locale" pour savoir quand l'utiliser.

2. **Priorité** : Toujours commencer par `debugging-toolkit` en cas de bug (API, désynchronisation), `ui-design` pour le visuel, `frontend-mobile-development` pour les interactions et le responsive.

3. **Gestion des sessions** : Toujours gérer les cas de salle pleine, joueur qui quitte, etc. Utiliser `error-debugging` pour les erreurs complexes.

4. **Temps réel** : Le polling à 2-3s est suffisant. Ne pas ajouter de WebSockets (complexité inutile). Utiliser `application-performance` pour valider le rendu.

5. **Documentation** : Utiliser `code-documentation` pour commenter le code, mais privilégier le code auto-documenté (fonctions nommées explicitement, variables claires). Documenter les APIs dans `docs/API.md`.

6. **Accessibilité** : Toujours valider l'accessibilité après chaque modification UI majeure (contraste des cartes, navigation clavier, lecture d'écran).

7. **Tests** : Suivre le cycle TDD pour les nouvelles fonctionnalités (Red → Green → Refactor). Tester particulièrement la logique des jeux (Blackjack, Tarot, Pyramide, Bizkit), le calcul des scores, et la gestion des tours.

8. **Performance** : Valider les performances du polling (temps de réponse des appels API, rendu des cartes) et du rendu (scrolling fluide des mains).