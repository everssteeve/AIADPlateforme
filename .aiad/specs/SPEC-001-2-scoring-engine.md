# SPEC-001-2-scoring-engine — variante EARS

**Intent parent** : INTENT-001-diagnostic-equipe
**Auteur** : Steeve
**Date** : 2026-05-20
**Statut** : draft
**Format** : EARS
**SQS** : [À évaluer via /sdd gate]

---

## 1. Contexte

Le diagnostic équipe produit des recommandations concrètes AIAD/SDD Mode sans recours à un LLM (ADR-001). Ce moteur de scoring est le cœur métier de la plateforme en v1 : il calcule un score par dimension à partir des réponses du wizard et génère les recommandations. Les fonctions sont pures — sans effet de bord — pour garantir l'auditabilité et la testabilité à 100 %.

## 2. Comportement Attendu

### Input

```ts
type DiagnosticAnswers = Record<string, string | number | string[]>
// Clés = identifiants de questions (ex: "q1", "q2_tools"), valeurs = réponses
```

### Processing

1. Validation des réponses requises (liste définie dans `questions.ts`).
2. Pour chaque dimension (ex: `practices`, `tooling`, `governance`, `culture`), calcul d'un score [0–100] par agrégation pondérée des réponses.
3. Calcul d'un score global = moyenne pondérée des dimensions.
4. Mapping score global + scores par dimension → liste de recommandations triées par priorité.

### Output

```ts
type DiagnosticScore = {
  global: number              // [0–100]
  dimensions: Record<string, number>  // score par dimension [0–100]
}

type Recommendation = {
  id: string
  type: 'AIAD' | 'SDD_MODE' | 'GENERAL'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  link?: string               // URL vers aiad.ovh ou docs SDD Mode
}
```

### Cas limites

- Réponses requises manquantes → lever `TypeError` avec code `MISSING_REQUIRED_ANSWERS` et liste des clés manquantes.
- Score global ≥ 70 → au moins 1 recommandation de type `AIAD` ou `SDD_MODE` avec `priority: 'low'` (renforcement).
- Score global < 30 → au moins 3 recommandations de type `AIAD` ou `SDD_MODE` avec `priority: 'high'`.
- Valeur de réponse hors plage définie → lever `RangeError` avec la clé et la valeur invalide.

## 3. Critères d'Acceptation (EARS)

### CA-001 — Score global dans la plage [0–100]

> Pattern : Ubiquitous

`The scoring engine SHALL return a DiagnosticScore where global is a number in the range [0, 100] inclusive for any valid DiagnosticAnswers input.`

- [ ] Implémenté
- [ ] Testé : `tests/unit/scoring/engine.test.ts::score-global-range`

### CA-002 — Score par dimension dans la plage [0–100]

> Pattern : Ubiquitous

`The scoring engine SHALL return a DiagnosticScore where each dimension value is a number in the range [0, 100] inclusive.`

- [ ] Implémenté
- [ ] Testé : `tests/unit/scoring/engine.test.ts::score-dimensions-range`

### CA-003 — Déterminisme du scoring

> Pattern : Ubiquitous

`The scoring engine SHALL return an identical DiagnosticScore when called twice with identical DiagnosticAnswers input.`

- [ ] Implémenté
- [ ] Testé : `tests/unit/scoring/engine.test.ts::determinism`

### CA-004 — Recommandation AIAD/SDD_MODE toujours présente

> Pattern : Ubiquitous

`The recommendations engine SHALL return at least one Recommendation with type 'AIAD' or 'SDD_MODE' for any DiagnosticScore input.`

- [ ] Implémenté
- [ ] Testé : `tests/unit/scoring/recommendations.test.ts::aiad-always-present`

### CA-005 — Priorité haute pour score faible

> Pattern : State-driven

`WHILE the global score is below 30, the recommendations engine SHALL return at least three Recommendations with type 'AIAD' or 'SDD_MODE' and priority 'high'.`

- [ ] Implémenté
- [ ] Testé : `tests/unit/scoring/recommendations.test.ts::low-score-high-priority`

### CA-006 — Rejet des réponses manquantes

> Pattern : Unwanted behaviour

`IF computeScore is called with DiagnosticAnswers missing one or more required question keys, THEN the scoring engine SHALL throw a TypeError with code 'MISSING_REQUIRED_ANSWERS' and an array of the missing keys.`

- [ ] Implémenté
- [ ] Testé : `tests/unit/scoring/engine.test.ts::missing-answers-rejection`

### CA-007 — Rejet des valeurs hors plage

> Pattern : Unwanted behaviour

`IF computeScore is called with a question value outside the defined valid range for that question, THEN the scoring engine SHALL throw a RangeError identifying the invalid question key and received value.`

- [ ] Implémenté
- [ ] Testé : `tests/unit/scoring/engine.test.ts::out-of-range-rejection`

### CA-008 — Lien d'installation dans au moins une recommandation SDD_MODE

> Pattern : Ubiquitous

`The recommendations engine SHALL include a non-empty link field in at least one Recommendation with type 'SDD_MODE' pointing to the SDD Mode installation documentation.`

- [ ] Implémenté
- [ ] Testé : `tests/unit/scoring/recommendations.test.ts::sdd-mode-link-present`

## 4. Interface / API

```ts
// lib/scoring/questions.ts
export const QUESTIONS: Question[] = [
  { id: 'q_practices_agents', dimension: 'practices', weight: 1.5, type: 'scale', min: 0, max: 4 },
  { id: 'q_tooling_sdd', dimension: 'tooling', weight: 2.0, type: 'boolean' },
  // ... (liste complète à définir avec le PE lors de l'exécution)
]

export const REQUIRED_QUESTION_IDS: string[] = QUESTIONS.map(q => q.id)

// lib/scoring/engine.ts
export function computeScore(answers: DiagnosticAnswers): DiagnosticScore

// lib/scoring/recommendations.ts
export function generateRecommendations(score: DiagnosticScore): Recommendation[]
```

## 5. Dépendances

- Aucune SPEC parente (fonctions pures, pas de DB)
- Les types `DiagnosticAnswers`, `DiagnosticScore`, `Recommendation` sont définis dans `lib/scoring/types.ts`

## 6. Estimation Context Engineering Budget

- AGENT-GUIDE (condensé §11 ARCHITECTURE) : ~400 tokens
- Cette SPEC : ~800 tokens
- Fichiers source pertinents : `lib/scoring/` (vide à date)
- **Total estimé** : ~1 200 tokens

## 7. Definition of Output Done (DoOD)

- [ ] Code + lint passing (Biome)
- [ ] Tests unitaires Vitest couvrant les 8 critères d'acceptation (coverage 100 % sur `lib/scoring/`)
- [ ] **EARS lint : 0 violation** (skill `ears-validator`)
- [ ] SPEC mise à jour si écart (Drift Lock)
- [ ] Annotations `@spec SPEC-001-2-scoring-engine` + `@verified-by` posées dans `lib/scoring/`
- [ ] Code review passée
- [ ] Gouvernance RGESN vérifiée (algorithme léger, pas d'appel réseau)
