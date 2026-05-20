# SPEC-001-5-page-resultats — variante EARS

**Intent parent** : INTENT-001-diagnostic-equipe
**Auteur** : Steeve
**Date** : 2026-05-20
**Statut** : draft
**Format** : EARS
**SQS** : [À évaluer via /sdd gate]

---

## 1. Contexte

C'est la page de conversion clé de la plateforme : Gérard termine le diagnostic et reçoit ses résultats personnalisés. Le critère de drift de l'INTENT-001 est directement lié à cette page — elle doit afficher au moins une recommandation concrète AIAD/SDD Mode avec un lien d'installation. L'objectif de conversion est que 80 % des devs seniors qui voient cette page installent SDD Mode.

## 2. Comportement Attendu

### Input

URL `/results/[runId]` — le `runId` est un `diagnostic_run.id` avec `status: 'scored'`.

### Processing

1. Chargement du `diagnostic_run` via `GET /api/diagnostic-runs/[id]` (côté serveur, Server Component).
2. Rendu du score global + scores par dimension sous forme visuelle (chart ou jauge).
3. Rendu des recommandations triées par priorité.
4. Mise en évidence des recommandations de type `SDD_MODE` avec un call-to-action d'installation.

### Output

Page statiquement rendue (SSR) contenant : score global, scores par dimension, liste de recommandations, CTA d'installation SDD Mode.

### Cas limites

- `runId` inexistant ou hors organisation → HTTP 404, page d'erreur explicite.
- `status` du run est `draft` ou `submitted` (scoring pas encore terminé) → affichage d'un état de chargement avec rafraîchissement automatique toutes les 2 secondes.
- Aucune recommandation `SDD_MODE` dans le résultat → **impossible par construction** (CA-004 de SPEC-001-2 garantit au moins 1). Défense en profondeur : si absent, afficher un fallback avec lien direct vers aiad.ovh.
- Utilisateur non authentifié accède à une URL de résultats → redirection vers `/login` avec `redirect` param.

## 3. Critères d'Acceptation (EARS)

### CA-001 — Affichage du score global

> Pattern : Event-driven

`WHEN the results page is loaded with a valid runId belonging to the authenticated user's organization, the results page SHALL display the global score as a numeric value between 0 and 100 and a visual representation (chart or gauge).`

- [ ] Implémenté
- [ ] Testé : `tests/e2e/results-page.spec.ts::score-displayed`

### CA-002 — Affichage des scores par dimension

> Pattern : Event-driven

`WHEN the results page is loaded, the results page SHALL display a score for each dimension defined in lib/scoring/questions.ts alongside its dimension label.`

- [ ] Implémenté
- [ ] Testé : `tests/e2e/results-page.spec.ts::dimension-scores-displayed`

### CA-003 — Recommandations triées par priorité

> Pattern : Event-driven

`WHEN the results page is loaded, the results page SHALL display all recommendations sorted by priority in the order: 'high', 'medium', 'low'.`

- [ ] Implémenté
- [ ] Testé : `tests/e2e/results-page.spec.ts::recommendations-sorted`

### CA-004 — CTA SDD Mode visible et cliquable

> Pattern : Ubiquitous

`The results page SHALL display at least one call-to-action element labeled 'Installer SDD Mode' linking to the SDD Mode installation documentation URL defined in the SDD_MODE recommendation returned by the scoring engine.`

- [ ] Implémenté
- [ ] Testé : `tests/e2e/results-page.spec.ts::sdd-mode-cta-present`

### CA-005 — État de chargement si run non scoré

> Pattern : State-driven

`WHILE the diagnostic_run status is not 'scored', the results page SHALL display a loading state.`

- [ ] Implémenté
- [ ] Testé : `tests/e2e/results-page.spec.ts::loading-state-displayed`

### CA-006 — Polling jusqu'à la disponibilité du résultat

> Pattern : State-driven

`WHILE the diagnostic_run status is not 'scored', the results page SHALL poll GET /api/diagnostic-runs/[id] every 2 seconds until the status becomes 'scored'.`

- [ ] Implémenté
- [ ] Testé : `tests/e2e/results-page.spec.ts::polling-every-2s`

### CA-007 — Redirection si non authentifié

> Pattern : Unwanted behaviour

`IF an unauthenticated request is made to /results/[runId], THEN the results page SHALL redirect to /login?redirect=/results/[runId].`

- [ ] Implémenté
- [ ] Testé : `tests/e2e/results-page.spec.ts::unauthenticated-redirect`

### CA-008 — Page 404 pour runId hors organisation

> Pattern : Unwanted behaviour

`IF the runId does not exist or belongs to a different organization than the authenticated user, THEN the results page SHALL render a 404 page without disclosing the existence of the resource.`

- [ ] Implémenté
- [ ] Testé : `tests/e2e/results-page.spec.ts::cross-org-404`

### CA-009 — Fallback lien aiad.ovh si SDD_MODE absent

> Pattern : Unwanted behaviour

`IF no recommendation with type 'SDD_MODE' is present in the diagnostic_run results, THEN the results page SHALL display a call-to-action element linking to https://aiad.ovh.`

- [ ] Implémenté
- [ ] Testé : `tests/e2e/results-page.spec.ts::fallback-aiad-link`

## 4. Interface / API

```
Route Next.js :
  /results/[runId]    → Server Component (charge le run côté serveur)

Composants :
  components/results/ScoreOverview.tsx        ← score global + chart
  components/results/DimensionScores.tsx      ← scores par dimension
  components/results/RecommendationList.tsx   ← liste triée par priorité
  components/results/RecommendationCard.tsx   ← carte individuelle (avec CTA si SDD_MODE)
  components/results/LoadingState.tsx         ← état polling (status != 'scored')
```

## 5. Dépendances

- **SPEC-001-3** (API `GET /api/diagnostic-runs/[id]`)
- **SPEC-001-2** (types `DiagnosticScore`, `Recommendation` — pour le rendu)

## 6. Estimation Context Engineering Budget

- AGENT-GUIDE (condensé §11 ARCHITECTURE) : ~400 tokens
- Cette SPEC : ~900 tokens
- Fichiers source pertinents : `lib/scoring/types.ts`, `app/results/`
- **Total estimé** : ~1 700 tokens

## 7. Definition of Output Done (DoOD)

- [ ] Code + lint passing (Biome)
- [ ] Tests E2E Playwright couvrant les 8 critères d'acceptation
- [ ] **EARS lint : 0 violation** (skill `ears-validator`)
- [ ] SPEC mise à jour si écart (Drift Lock)
- [ ] Annotations `@spec SPEC-001-5-page-resultats` + `@verified-by` posées dans `app/results/` et `components/results/`
- [ ] Code review passée
- [ ] Gouvernance RGAA vérifiée (contraste, alt text charts, navigation clavier sur les CTA)
- [ ] Drift check : page affiche bien ≥ 1 recommandation SDD_MODE avec lien (critère de drift INTENT-001)
