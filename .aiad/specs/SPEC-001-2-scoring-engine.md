# SPEC-001-2-scoring-engine — variante EARS

**Intent parent** : INTENT-001-diagnostic-equipe
**Auteur** : Steeve
**Date** : 2026-05-20
**Statut** : done
**Format** : EARS
**SQS** : 5/5 — Gate OUVERTE

---

## 1. Contexte

Le diagnostic équipe produit des recommandations concrètes AIAD/SDD Mode sans recours à un LLM (ADR-001). Ce moteur de scoring est le cœur métier de la plateforme en v1 : il calcule un score par dimension à partir des réponses du wizard et génère les recommandations. Les fonctions sont pures — sans effet de bord — pour garantir l'auditabilité et la testabilité à 100 %.

**Échelle** : [1–4] correspondant aux 4 niveaux de maturité (Auto-complétion → Vibe Coding → Context Engineering → Spec-Driven Development). Les valeurs décimales représentent des niveaux intermédiaires.

## 2. Comportement Attendu

### Input

```ts
// Clés = indices de questions (0–13), valeurs = réponses (1–4)
type DiagnosticAnswers = Record<number, 1 | 2 | 3 | 4>
```

### Dimensions

| Id | Index | Label | Short |
|----|-------|-------|-------|
| `tools` | 0 | Outils & Environnement | Outils |
| `process` | 1 | Process de Développement | Process |
| `docs` | 2 | Documentation & Artefacts | Documentation |
| `quality` | 3 | Qualité & Tests | Qualité |
| `collab` | 4 | Collaboration & Rôles | Collaboration |
| `vision` | 5 | Vision & Stratégie | Vision |

### Processing

1. Validation : toutes les clés 0–13 doivent être présentes dans `DiagnosticAnswers`.
2. Validation : chaque valeur doit être un entier dans `{1, 2, 3, 4}`.
3. Pour chaque dimension `i`, calcul du score `dimScores[i]` = moyenne arithmétique des réponses des questions appartenant à cette dimension.
4. Calcul du score global `globalScore` = moyenne arithmétique de `dimScores[0..5]`.
5. Calcul du niveau global `globalLevel` :
   - `globalScore < 1.75` → niveau `1`
   - `1.75 ≤ globalScore < 2.50` → niveau `2`
   - `2.50 ≤ globalScore < 3.25` → niveau `3`
   - `globalScore ≥ 3.25` → niveau `4`
6. Mapping `globalLevel` + `dimScores` → recommandations (globales + par dimension).

### Output

```ts
type DiagnosticScore = {
  globalScore: number         // [1.0–4.0]
  globalLevel: 1 | 2 | 3 | 4
  dimScores: number[]         // longueur 6, chaque valeur dans [1.0–4.0]
}

// Recommandations globales : 4–5 actions concrètes pour passer au niveau suivant
type GlobalRecommendations = string[]

// Recommandation par dimension : 1 phrase actionnable
type DimensionRecommendation = string
```

### Cas limites

- Réponse manquante (clé absente pour 0–13) → lever `TypeError` avec code `MISSING_REQUIRED_ANSWERS` et liste des indices manquants.
- Valeur hors plage `{1,2,3,4}` → lever `RangeError` avec la clé et la valeur reçue.
- Score global ≥ 3.25 (niveau 4) → les recommandations globales célèbrent et proposent du renforcement (pas de "passage au niveau suivant").

## 2.bis Données — Questions

14 questions réparties sur 6 dimensions. L'option A correspond au niveau 1, l'option D au niveau 4.

### Q0 — tools
**Quels outils IA votre équipe utilise-t-elle au quotidien ?**

| Option | Niveau | Texte |
|--------|--------|-------|
| A | 1 | Copilot / TabNine pour l'auto-complétion dans l'IDE |
| B | 2 | Cursor / Windsurf / ChatGPT pour générer des blocs de code entiers |
| C | 3 | Agent IA de codage (Claude Code, Codex CLI) avec MCP, fichier de config, SubAgents |
| D | 4 | Agent IA orchestré par des specs formalisées (PRD → ARCHITECTURE → SPECS → Code) |

### Q1 — tools
**Comment votre agent IA accède-t-il au contexte de votre projet ?**

| Option | Niveau | Texte |
|--------|--------|-------|
| A | 1 | Il n'a pas de contexte spécifique, il travaille fichier par fichier |
| B | 2 | On lui copie-colle du contexte dans le prompt quand nécessaire |
| C | 3 | Un fichier de config (CLAUDE.md / AGENTS.md) + MCP lui donne accès au projet |
| D | 4 | Plusieurs documents vivants (PRD, ARCHITECTURE, AGENT-GUIDE, SPECS) structurent systématiquement son contexte |

### Q2 — tools
**Votre agent IA utilise-t-il des extensions ou des connexions à des outils externes ?**

| Option | Niveau | Texte |
|--------|--------|-------|
| A | 1 | Non, juste l'auto-complétion dans l'IDE |
| B | 2 | Pas vraiment, on utilise principalement le chat |
| C | 3 | Oui, des MCP (Playwright, Context7, BD…) et/ou des SubAgents spécialisés |
| D | 4 | Oui, un écosystème complet : MCP + SubAgents + Skills + Hooks + pipeline CI/CD intégré |

### Q3 — process
**Comment une nouvelle fonctionnalité est-elle développée ?**

| Option | Niveau | Texte |
|--------|--------|-------|
| A | 1 | Le dev code manuellement avec aide IA pour compléter le code |
| B | 2 | On décrit la fonctionnalité en langage naturel et l'IA génère le code |
| C | 3 | On prépare le contexte (docs, règles) puis on guide l'agent étape par étape |
| D | 4 | On rédige une SPEC formalisée, l'agent planifie puis implémente, on valide |

### Q4 — process
**Combien de fonctionnalités développez-vous en parallèle avec l'IA ?**

| Option | Niveau | Texte |
|--------|--------|-------|
| A | 1 | L'IA assiste sur le fichier en cours, pas de notion de « fonctionnalité » |
| B | 2 | On essaie de faire tout d'un coup (approche « Big Bang ») |
| C | 3 | On découpe en tâches, mais sans formalisme strict |
| D | 4 | Strictement une fonctionnalité à la fois : Spec → Implémentation → Validation → Commit |

### Q5 — process
**Que se passe-t-il quand l'IA génère du code incorrect ?**

| Option | Niveau | Texte |
|--------|--------|-------|
| A | 1 | On corrige manuellement |
| B | 2 | On re-prompte jusqu'à obtenir quelque chose qui marche |
| C | 3 | On ajuste le contexte/prompt et on documente l'erreur dans le fichier de config |
| D | 4 | On analyse si le problème vient de la SPEC, on corrige la source, et on ajoute une règle préventive |

### Q6 — docs
**Quelle documentation guide votre développement IA ?**

| Option | Niveau | Texte |
|--------|--------|-------|
| A | 1 | Pas de documentation spécifique à l'IA |
| B | 2 | Des prompts sauvegardés ou des notes informelles |
| C | 3 | Un CLAUDE.md / AGENTS.md avec des règles, patterns et vocabulaire métier |
| D | 4 | Un écosystème complet : PRD → ARCHITECTURE → AGENT-GUIDE → SPECS par tâche |

### Q7 — docs
**Vos documents de développement sont-ils mis à jour régulièrement ?**

| Option | Niveau | Texte |
|--------|--------|-------|
| A | 1 | Nous n'avons pas de docs spécifiques à l'IA |
| B | 2 | Rarement, on se concentre sur le code |
| C | 3 | Le fichier de config agent est enrichi à chaque itération |
| D | 4 | Tous les artefacts sont des documents vivants mis à jour systématiquement (rétrospective IA incluse) |

### Q8 — quality
**Comment gérez-vous la qualité du code généré par l'IA ?**

| Option | Niveau | Texte |
|--------|--------|-------|
| A | 1 | On vérifie manuellement le code suggéré avant de l'accepter |
| B | 2 | On teste manuellement en lançant l'application |
| C | 3 | L'agent génère des tests, on les valide et on exécute |
| D | 4 | Les tests attendus sont spécifiés dans la SPEC, couverture >80% visée, revue automatique par SubAgent |

### Q9 — quality
**Mesurez-vous des métriques liées à l'utilisation de l'IA ?**

| Option | Niveau | Texte |
|--------|--------|-------|
| A | 1 | Non |
| B | 2 | Pas formellement, on a une idée du gain de temps |
| C | 3 | On suit quelques indicateurs (taux d'adoption, bugs) |
| D | 4 | Dashboard avec vélocité, first-time success rate, couverture tests, lead time, ratio génération/correction |

### Q10 — collab
**Comment les rôles sont-ils définis par rapport à l'IA ?**

| Option | Niveau | Texte |
|--------|--------|-------|
| A | 1 | Les devs utilisent l'IA individuellement, pas d'impact sur les rôles |
| B | 2 | Certains devs sont plus « vibe coders » que d'autres, pas de formalisme |
| C | 3 | On commence à distinguer des rôles (qui prépare le contexte, qui valide) |
| D | 4 | Rôles clairement définis : Product Owner, Tech Lead, Product Engineer, QA Engineer |

### Q11 — collab
**Comment partagez-vous les bonnes pratiques IA dans l'équipe ?**

| Option | Niveau | Texte |
|--------|--------|-------|
| A | 1 | Informellement, chacun découvre par soi-même |
| B | 2 | On partage des prompts qui marchent bien |
| C | 3 | On a un guide partagé et des rétrospectives incluant l'IA |
| D | 4 | Rétrospectives IA dédiées, AGENT-GUIDE collaboratif, coaching hebdomadaire, métriques d'efficacité IA suivies |

### Q12 — vision
**Quelle est la vision de votre équipe sur l'IA dans le développement ?**

| Option | Niveau | Texte |
|--------|--------|-------|
| A | 1 | Un outil pratique pour aller plus vite sur le code |
| B | 2 | Un moyen de générer du code plus rapidement |
| C | 3 | Un partenaire de développement qu'il faut bien configurer et guider |
| D | 4 | Un changement de paradigme : les devs deviennent des orchestrateurs stratégiques |

### Q13 — vision
**Où en êtes-vous dans la gestion de la sécurité du code IA ?**

| Option | Niveau | Texte |
|--------|--------|-------|
| A | 1 | On fait confiance à l'IA + revue manuelle classique |
| B | 2 | On n'y pense pas vraiment, on se concentre sur le résultat |
| C | 3 | Validation systématique, pas de secrets dans les prompts, scan de sécurité |
| D | 4 | Agent Sécurité dédié, scan automatique post-génération, gouvernance formalisée, audit trail |

## 2.ter Données — Recommandations

### Recommandations globales par niveau

Les chaînes suivantes sont la source de vérité pour `getGlobalRecommendations(level)`.

**Niveau 1**
1. Essayez de décrire votre prochaine fonctionnalité en langage naturel plutôt que de coder directement
2. Testez Cursor ou Claude Code pour générer des blocs de code entiers
3. Commencez par un petit projet pour expérimenter le vibe coding
4. Formez-vous aux prompts efficaces pour le développement

**Niveau 2**
1. Créez un fichier CLAUDE.md avec les règles et conventions de votre projet
2. Installez des MCP (Context7, Playwright) pour enrichir le contexte de votre agent
3. Arrêtez le Big Bang : développez une fonctionnalité à la fois
4. Documentez les erreurs récurrentes de l'agent pour les éviter
5. Mettez en place des SubAgents spécialisés (Code Reviewer, Test Writer)

**Niveau 3**
1. Formalisez vos spécifications : chaque tâche devrait avoir une SPEC écrite
2. Adoptez le workflow : PRD → ARCHITECTURE → SPECS → Implémentation → Validation
3. Mettez en place des métriques d'efficacité IA (first-time success rate, couverture tests)
4. Introduisez les rétrospectives IA dans vos rituels d'équipe
5. Découvrez le framework AIAD pour structurer votre approche

**Niveau 4**
1. Félicitations ! Vous êtes dans le top <5% des organisations
2. Optimisez vos Agents Spécialisés (Sécurité, Qualité, Documentation)
3. Mesurez votre ROI et partagez vos résultats avec la communauté
4. Envisagez de former d'autres équipes à votre approche
5. Contribuez à l'évolution du framework AIAD

### Recommandations par dimension et par niveau

Source de vérité pour `getDimensionRecommendation(dimensionId, level)`.

| Dimension | Niveau 1 | Niveau 2 | Niveau 3 | Niveau 4 |
|-----------|----------|----------|----------|----------|
| **tools** | Explorez les agents IA de codage (Claude Code, Cursor) au-delà de la simple auto-complétion | Configurez un fichier CLAUDE.md et connectez des MCP pour structurer le contexte de votre agent | Complétez votre écosystème avec un pipeline de spécifications formalisées (PRD → ARCHITECTURE → SPECS) | Votre outillage est au top ! Continuez à optimiser et partager vos configurations |
| **process** | Commencez à décrire vos fonctionnalités en langage naturel pour l'IA plutôt que de coder directement | Structurez votre approche : découpez en tâches et guidez l'agent avec du contexte préparé | Formalisez le cycle complet : Spec → Plan → Implémentation → Validation → Commit | Votre process est exemplaire ! Affinez les métriques de cycle et réduisez le lead time |
| **docs** | Créez au minimum un fichier de configuration agent avec les règles de base de votre projet | Structurez votre documentation : ajoutez des patterns, du vocabulaire métier, des anti-patterns | Mettez en place l'écosystème complet d'artefacts : PRD, ARCHITECTURE, AGENT-GUIDE, SPECS | Documentation exemplaire ! Automatisez la détection de docs obsolètes avec un Agent Documentation |
| **quality** | Demandez à votre agent IA de générer des tests unitaires pour le code qu'il produit | Faites générer les tests par l'agent et exécutez-les systématiquement avant de valider | Spécifiez les tests attendus dans vos SPECS et visez >80% de couverture avec revue automatique | Qualité au top ! Ajoutez des tests de mutation et un Agent Qualité pour détecter les faiblesses |
| **collab** | Partagez les bonnes pratiques IA entre développeurs, ne laissez pas chacun seul | Commencez à distinguer les rôles : qui prépare le contexte, qui orchestre, qui valide | Formalisez les rôles (Product Engineer, QA) et instaurez des rétrospectives IA dédiées | Collaboration exemplaire ! Formez d'autres équipes et partagez votre modèle organisationnel |
| **vision** | Prenez conscience que l'IA est plus qu'un outil de productivité — c'est un changement de paradigme | Investissez dans la configuration et le guidage de l'agent plutôt que de juste « générer du code » | Adoptez pleinement le paradigme : les devs deviennent des orchestrateurs, l'intention prime sur l'exécution | Vision exemplaire ! Évangélisez en interne et contribuez à la communauté AIAD |

## 3. Critères d'Acceptation (EARS)

### CA-001 — Score global dans la plage [1.0–4.0]

> Pattern : Ubiquitous

`The scoring engine SHALL return a DiagnosticScore where globalScore is a number in the range [1.0, 4.0] inclusive for any valid DiagnosticAnswers input.`

- [x] Implémenté
- [x] Testé : `tests/unit/scoring/engine.test.ts::score-global-range`

### CA-002 — Scores par dimension dans la plage [1.0–4.0]

> Pattern : Ubiquitous

`The scoring engine SHALL return a DiagnosticScore where each value in dimScores is a number in the range [1.0, 4.0] inclusive.`

- [x] Implémenté
- [x] Testé : `tests/unit/scoring/engine.test.ts::score-dimensions-range`

### CA-003 — 6 scores de dimension retournés

> Pattern : Ubiquitous

`The scoring engine SHALL return a DiagnosticScore where dimScores has exactly 6 elements, one per dimension (tools, process, docs, quality, collab, vision).`

- [x] Implémenté
- [x] Testé : `tests/unit/scoring/engine.test.ts::score-dimensions-count`

### CA-004 — Déterminisme du scoring

> Pattern : Ubiquitous

`The scoring engine SHALL return an identical DiagnosticScore when called twice with identical DiagnosticAnswers input.`

- [x] Implémenté
- [x] Testé : `tests/unit/scoring/engine.test.ts::determinism`

### CA-005a — Niveau 1 si globalScore < 1.75

> Pattern : State-driven

`WHILE globalScore is less than 1.75, the scoring engine SHALL return a DiagnosticScore with globalLevel equal to 1.`

- [x] Implémenté
- [x] Testé : `tests/unit/scoring/engine.test.ts::level-threshold-1`

### CA-005b — Niveau 2 si 1.75 ≤ globalScore < 2.50

> Pattern : State-driven

`WHILE globalScore is greater than or equal to 1.75 and less than 2.50, the scoring engine SHALL return a DiagnosticScore with globalLevel equal to 2.`

- [x] Implémenté
- [x] Testé : `tests/unit/scoring/engine.test.ts::level-threshold-2`

### CA-005c — Niveau 3 si 2.50 ≤ globalScore < 3.25

> Pattern : State-driven

`WHILE globalScore is greater than or equal to 2.50 and less than 3.25, the scoring engine SHALL return a DiagnosticScore with globalLevel equal to 3.`

- [x] Implémenté
- [x] Testé : `tests/unit/scoring/engine.test.ts::level-threshold-3`

### CA-005d — Niveau 4 si globalScore ≥ 3.25

> Pattern : State-driven

`WHILE globalScore is greater than or equal to 3.25, the scoring engine SHALL return a DiagnosticScore with globalLevel equal to 4.`

- [x] Implémenté
- [x] Testé : `tests/unit/scoring/engine.test.ts::level-threshold-4`

### CA-006 — Recommandations globales pour chaque niveau

> Pattern : Ubiquitous

`The recommendations engine SHALL return a non-empty GlobalRecommendations array for any globalLevel in {1, 2, 3, 4}.`

- [x] Implémenté
- [x] Testé : `tests/unit/scoring/recommendations.test.ts::global-recs-all-levels`

### CA-007 — Recommandation par dimension pour toute combinaison valide

> Pattern : Ubiquitous

`The recommendations engine SHALL return a non-empty DimensionRecommendation string for any combination of valid dimensionId in {'tools','process','docs','quality','collab','vision'} and level in {1, 2, 3, 4}.`

- [x] Implémenté
- [x] Testé : `tests/unit/scoring/recommendations.test.ts::dim-recs-all-combinations`

### CA-008 — Rejet des réponses manquantes

> Pattern : Unwanted behaviour

`IF computeScore is called with DiagnosticAnswers missing one or more keys in {0…13}, THEN the scoring engine SHALL throw a TypeError with code 'MISSING_REQUIRED_ANSWERS' and an array of the missing question indices.`

- [x] Implémenté
- [x] Testé : `tests/unit/scoring/engine.test.ts::missing-answers-rejection`

### CA-009 — Rejet des valeurs hors plage

> Pattern : Unwanted behaviour

`IF computeScore is called with a question value outside {1, 2, 3, 4}, THEN the scoring engine SHALL throw a RangeError identifying the invalid question index and the received value.`

- [x] Implémenté
- [x] Testé : `tests/unit/scoring/engine.test.ts::out-of-range-rejection`

### CA-010 — Recommandations niveau 4 sans invitation à progresser

> Pattern : State-driven

`WHILE globalLevel equals 4, the recommendations engine SHALL return a GlobalRecommendations array where no item contains the substrings "pour passer au niveau", "progresser vers Niv." or "pour atteindre le niveau".`

- [x] Implémenté
- [x] Testé : `tests/unit/scoring/recommendations.test.ts::level4-no-next-level`

## 4. Interface / API

```ts
// lib/scoring/types.ts
export type DiagnosticAnswers = Record<number, 1 | 2 | 3 | 4>

export type DiagnosticScore = {
  globalScore: number
  globalLevel: 1 | 2 | 3 | 4
  dimScores: number[]   // longueur 6, ordre : tools/process/docs/quality/collab/vision
}

export type DimensionId = 'tools' | 'process' | 'docs' | 'quality' | 'collab' | 'vision'

export type Dimension = {
  id: DimensionId
  label: string
  short: string
}

export type Question = {
  index: number         // 0–13
  dimension: number     // 0–5 (index dans DIMENSIONS)
  text: string
  options: [string, string, string, string]  // A=niveau 1, D=niveau 4
}

// lib/scoring/questions.ts
export const DIMENSIONS: Dimension[]   // 6 entrées, ordre : tools/process/docs/quality/collab/vision
export const QUESTIONS: Question[]     // 14 entrées, données §2.bis
export const QUESTION_COUNT = 14

// lib/scoring/engine.ts
export function computeScore(answers: DiagnosticAnswers): DiagnosticScore

// lib/scoring/recommendations.ts
export function getGlobalRecommendations(level: 1 | 2 | 3 | 4): string[]
export function getDimensionRecommendation(dimensionId: DimensionId, level: 1 | 2 | 3 | 4): string
// Données : §2.ter
```

## 5. Dépendances

- Aucune SPEC parente (fonctions pures, pas de DB)
- Types définis dans `lib/scoring/types.ts`
- `AIMaturityDiagnostic` (composant wizard) consomme ces fonctions — voir SPEC-001-4-wizard-ui

## 6. Estimation Context Engineering Budget

- AGENT-GUIDE (condensé §11 ARCHITECTURE) : ~400 tokens
- Cette SPEC : ~2 500 tokens
- Fichiers source pertinents : `lib/scoring/` (vide à date)
- **Total estimé** : ~2 900 tokens

## 7. Definition of Output Done (DoOD)

- [x] Code + lint passing (Biome)
- [x] Tests unitaires Vitest couvrant les 13 critères d'acceptation (coverage 100 % sur `lib/scoring/`)
- [x] **EARS lint : 0 violation** (skill `ears-validator`)
- [x] SPEC mise à jour si écart (Drift Lock)
- [x] Annotations `@spec SPEC-001-2-scoring-engine` + `@verified-by` posées dans `lib/scoring/`
- [x] Code review passée
- [x] Gouvernance RGESN vérifiée (algorithme léger, pas d'appel réseau)
