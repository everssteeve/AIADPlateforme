# SPEC-001-3-api-diagnostic — variante EARS

**Intent parent** : INTENT-001-diagnostic-equipe
**Auteur** : Steeve
**Date** : 2026-05-20
**Statut** : done
**Format** : EARS
**SQS** : 5/5 — Gate OUVERTE (2026-05-21)

---

## 1. Contexte

Le wizard multi-étapes du diagnostic équipe nécessite trois routes API : sauvegarde de draft (persistance inter-étapes), soumission finale (scoring + persistance du résultat), et lecture des résultats (pour la page de résultats). Ces routes sont les seuls points d'entrée entre l'UI et la base de données — elles doivent valider, isoler par organisation et calculer le score de façon synchrone.

## 2. Comportement Attendu

### Input

- `PATCH /api/diagnostic-runs/[id]` — sauvegarde partielle (draft)
- `POST /api/campaigns/[id]/diagnostic/submit` — soumission finale
- `GET /api/diagnostic-runs/[id]` — lecture résultats

### Processing

1. Authentification via Supabase Auth (JWT vérifié côté serveur).
2. Validation Zod du payload.
3. Vérification que le `campaign_id` ou `run_id` appartient à l'organisation de l'utilisateur (via RLS Supabase).
4. Pour `submit` : appel synchrone à `computeScore` + `generateRecommendations`, mise à jour `status → 'scored'`.

### Output

Réponses JSON typées. Erreurs normalisées avec `{ error: { code, message, details? } }`.

### Cas limites

- `run_id` inexistant ou hors organisation → HTTP 404.
- `campaign_id` hors organisation → HTTP 403.
- Payload invalide (Zod) → HTTP 400 avec erreurs champ par champ.
- Soumission d'un run déjà `scored` → HTTP 409 (conflit, idempotence non garantie).
- Utilisateur non authentifié → HTTP 401.

## 3. Critères d'Acceptation (EARS)

### CA-001 — Persistance du draft

> Pattern : Event-driven

`WHEN the API receives a valid PATCH /api/diagnostic-runs/[id] request from an authenticated contributor, the API SHALL persist the partial answers and current_step to the database.`

- [x] Implémenté
- [x] Testé : `tests/integration/api/diagnostic.test.ts::draft-save-persisted`

### CA-002 — Réponse HTTP 200 après persistance du draft

> Pattern : Event-driven

`WHEN the PATCH /api/diagnostic-runs/[id] persistence succeeds, the API SHALL return HTTP 200 with the updated diagnostic_run id and status 'draft'.`

- [ ] Implémenté
- [x] Testé : `tests/integration/api/diagnostic.test.ts::draft-save-200`

### CA-003 — Calcul du score à la soumission

> Pattern : Event-driven

`WHEN the API receives a valid POST /api/campaigns/[id]/diagnostic/submit request, the API SHALL compute the score and recommendations by invoking the scoring engine synchronously.`

- [x] Implémenté
- [x] Testé : `tests/integration/api/diagnostic.test.ts::submit-scoring-computed`

### CA-004 — Persistance du run scoré

> Pattern : Event-driven

`WHEN the scoring engine computation succeeds, the API SHALL persist the diagnostic_run with answers, score, recommendations, and status 'scored'.`

- [x] Implémenté
- [x] Testé : `tests/integration/api/diagnostic.test.ts::submit-run-persisted`

### CA-005 — Réponse HTTP 201 dans le délai imparti

> Pattern : Event-driven

`WHEN the diagnostic_run is persisted with status 'scored', the API SHALL return HTTP 201 with the diagnostic_run_id, score, and recommendations within 2000ms (p95).`

- [x] Implémenté
- [x] Testé : `tests/integration/api/diagnostic.test.ts::submit-201-within-2s`

### CA-006 — Lecture des résultats

> Pattern : Event-driven

`WHEN the API receives a GET /api/diagnostic-runs/[id] request from an authenticated user of the same organization, the API SHALL return HTTP 200 with the diagnostic_run including answers, score, recommendations, and status.`

- [x] Implémenté
- [x] Testé : `tests/integration/api/diagnostic.test.ts::get-results`

### CA-007 — Rejet payload invalide

> Pattern : Unwanted behaviour

`IF the request body fails Zod validation, THEN the API SHALL return HTTP 400 with a body containing { error: { code: 'VALIDATION_ERROR', details: <flattened Zod errors> } }.`

- [x] Implémenté
- [x] Testé : `tests/integration/api/diagnostic.test.ts::invalid-payload-400`

### CA-008 — Isolation par organisation

> Pattern : Unwanted behaviour

`IF the authenticated user's organization_id does not match the organization_id of the requested resource, THEN the API SHALL return HTTP 404 without disclosing the existence of the resource.`

- [x] Implémenté
- [x] Testé : `tests/integration/api/diagnostic.test.ts::cross-org-isolation`

### CA-009 — Rejet utilisateur non authentifié

> Pattern : Unwanted behaviour

`IF a request is received without a valid Supabase Auth JWT, THEN the API SHALL return HTTP 401 with body { error: { code: 'UNAUTHENTICATED' } }.`

- [x] Implémenté
- [x] Testé : `tests/integration/api/diagnostic.test.ts::unauthenticated-401`

### CA-010 — Rejet double soumission

> Pattern : Unwanted behaviour

`IF POST /api/campaigns/[id]/diagnostic/submit is called on a diagnostic_run that already has status 'scored', THEN the API SHALL return HTTP 409 with body { error: { code: 'ALREADY_SUBMITTED' } }.`

- [x] Implémenté
- [x] Testé : `tests/integration/api/diagnostic.test.ts::double-submit-409`

## 4. Interface / API

```ts
// PATCH /api/diagnostic-runs/[id]
// Body schema (Zod)
const draftSchema = z.object({
  answers: z.record(z.union([z.string(), z.number(), z.array(z.string())])),
  current_step: z.number().int().min(0),
})
// Response 200: { id: string, status: 'draft' }

// POST /api/campaigns/[id]/diagnostic/submit
// Body schema (Zod)
const submitSchema = z.object({
  team_id: z.string().uuid(),
  answers: z.record(z.union([z.string(), z.number(), z.array(z.string())])),
})
// Response 201: { id: string, score: DiagnosticScore, recommendations: Recommendation[], status: 'scored' }

// GET /api/diagnostic-runs/[id]
// Response 200: DiagnosticRun (toutes les colonnes sauf organization_id)
```

## 5. Dépendances

- **SPEC-001-1** (schéma DB — tables et RLS requis)
- **SPEC-001-2** (moteur scoring — `computeScore`, `generateRecommendations`)
- `lib/supabase/server.ts` — client Supabase avec cookies session

## 6. Estimation Context Engineering Budget

- AGENT-GUIDE (condensé §11 ARCHITECTURE) : ~400 tokens
- Cette SPEC : ~900 tokens
- Fichiers source pertinents : `lib/scoring/engine.ts`, `lib/supabase/server.ts`
- **Total estimé** : ~1 700 tokens

## 7. Definition of Output Done (DoOD)

- [x] Code + lint passing (Biome)
- [x] Tests d'intégration Vitest couvrant les 10 critères (Supabase local) — 21/21 PASS
- [x] **EARS lint : 0 violation** (skill `ears-validator`) — 10/10 conformes, bonus +1 critère 2
- [x] SPEC mise à jour si écart (Drift Lock) — statut → done, CA cochées
- [x] Annotations `@spec SPEC-001-3-api-diagnostic` + `@verified-by` posées dans `app/api/`
- [ ] Code review passée
- [x] Gouvernance RGPD vérifiée (isolation RLS + filtre organization_id applicatif, no PII en réponse)
