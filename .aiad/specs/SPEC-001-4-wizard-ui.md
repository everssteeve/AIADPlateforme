# SPEC-001-4-wizard-ui — variante EARS

**Intent parent** : INTENT-001-diagnostic-equipe
**Auteur** : Steeve
**Date** : 2026-05-20
**Statut** : draft
**Format** : EARS
**SQS** : [À évaluer via /sdd gate]

---

## 1. Contexte

Gérard (dev senior / coach d'équipe) réalise le diagnostic de son équipe via un wizard multi-étapes. Le draft est persisté à chaque étape pour permettre la reprise après interruption. À la soumission finale, le wizard appelle l'API de soumission et redirige vers la page de résultats.

## 2. Comportement Attendu

### Input

- URL d'entrée : `/diagnostic/[campaignId]` (ou création d'un nouveau run si inexistant)
- État initial : `diagnostic_run` en `status: 'draft'` ou création à la première étape

### Processing

1. Chargement des questions depuis `lib/scoring/questions.ts` (côté serveur).
2. Affichage de l'étape courante avec les réponses pré-remplies si draft existant.
3. À la navigation vers l'étape suivante : appel `PATCH /api/diagnostic-runs/[id]` avant le rendu de la nouvelle étape.
4. À la soumission finale (dernière étape) : appel `POST /api/campaigns/[id]/diagnostic/submit`, puis redirection vers `/results/[runId]`.

### Output

Page Next.js rendue en Server Component pour le chargement initial, Client Components pour les interactions du wizard.

### Cas limites

- L'utilisateur quitte le wizard sans terminer → draft persisté, reprise possible à la même étape.
- L'appel `PATCH` (draft save) échoue (réseau) → le wizard affiche un message d'erreur non-bloquant et propose de réessayer sans perdre les réponses saisies.
- L'utilisateur navigue directement vers une étape avancée sans avoir complété les étapes précédentes → redirection vers la première étape incomplète.
- La soumission finale échoue → le wizard affiche un message d'erreur et ne redirige pas.
- Le run est déjà `scored` (rechargement de page) → redirection vers `/results/[runId]`.

## 3. Critères d'Acceptation (EARS)

### CA-001 — Indicateur de progression

> Pattern : Ubiquitous

`The wizard UI SHALL display a progress indicator showing the current step number and total number of steps on every wizard step page.`

- [ ] Implémenté
- [ ] Testé : `tests/e2e/diagnostic-wizard.spec.ts::progress-indicator`

### CA-002 — Pré-remplissage depuis le draft

> Pattern : Event-driven

`WHEN the wizard step page is loaded for a diagnostic_run with status 'draft', the wizard UI SHALL pre-fill all input fields with the answer values stored in the diagnostic_run.answers for the current step.`

- [ ] Implémenté
- [ ] Testé : `tests/e2e/diagnostic-wizard.spec.ts::draft-prefill`

### CA-003 — Persistance du draft à la navigation

> Pattern : Event-driven

`WHEN the user navigates from one step to the next, the wizard UI SHALL call PATCH /api/diagnostic-runs/[id] with the current step answers before rendering the next step.`

- [ ] Implémenté
- [ ] Testé : `tests/e2e/diagnostic-wizard.spec.ts::draft-persisted-on-navigation`

### CA-004 — Appel de l'API à la soumission finale

> Pattern : Event-driven

`WHEN the user submits the final step of the wizard, the wizard UI SHALL call POST /api/campaigns/[id]/diagnostic/submit.`

- [ ] Implémenté
- [ ] Testé : `tests/e2e/diagnostic-wizard.spec.ts::submit-api-called`

### CA-005 — Redirection après soumission réussie

> Pattern : Event-driven

`WHEN POST /api/campaigns/[id]/diagnostic/submit returns HTTP 201, the wizard UI SHALL redirect to /results/[runId].`

- [ ] Implémenté
- [ ] Testé : `tests/e2e/diagnostic-wizard.spec.ts::submit-redirect-on-201`

### CA-006 — Bannière d'erreur en cas d'échec du draft

> Pattern : Unwanted behaviour

`IF the PATCH /api/diagnostic-runs/[id] call fails, THEN the wizard UI SHALL display a non-blocking error banner identifying the failed save attempt.`

- [ ] Implémenté
- [ ] Testé : `tests/e2e/diagnostic-wizard.spec.ts::draft-save-error-banner`

### CA-007 — Conservation des réponses en cas d'échec du draft

> Pattern : Unwanted behaviour

`IF the PATCH /api/diagnostic-runs/[id] call fails, THEN the wizard UI SHALL retain all user-entered answers in the form fields without navigating away.`

- [ ] Implémenté
- [ ] Testé : `tests/e2e/diagnostic-wizard.spec.ts::draft-save-error-answers-retained`

### CA-008 — Protection contre la navigation hors-séquence

> Pattern : Unwanted behaviour

`IF the user navigates directly to a step URL whose index is greater than the current_step value of the diagnostic_run, THEN the wizard UI SHALL redirect to the URL of the first incomplete step.`

- [ ] Implémenté
- [ ] Testé : `tests/e2e/diagnostic-wizard.spec.ts::out-of-sequence-redirect`

### CA-009 — Redirection si run déjà scoré

> Pattern : Event-driven

`WHEN the wizard is accessed for a diagnostic_run with status 'scored', the wizard UI SHALL redirect to /results/[runId] without displaying any wizard step.`

- [ ] Implémenté
- [ ] Testé : `tests/e2e/diagnostic-wizard.spec.ts::already-scored-redirect`

## 4. Interface / API

```
Routes Next.js :
  /diagnostic/[campaignId]           → création ou reprise d'un run (redirect vers step 1)
  /diagnostic/[campaignId]/[step]    → affichage de l'étape courante

Composants :
  components/wizard/WizardLayout.tsx       ← layout avec indicateur de progression
  components/wizard/WizardStep.tsx         ← affichage d'une étape
  components/wizard/WizardNavigation.tsx   ← boutons Précédent / Suivant / Soumettre
  components/wizard/QuestionRenderer.tsx   ← rendu d'une question selon son type
```

## 5. Dépendances

- **SPEC-001-3** (API routes — PATCH draft, POST submit)
- **SPEC-001-2** (questions data-driven — chargées côté serveur pour le rendu)
- Supabase Auth (session utilisateur authentifié)

## 6. Estimation Context Engineering Budget

- AGENT-GUIDE (condensé §11 ARCHITECTURE) : ~400 tokens
- Cette SPEC : ~900 tokens
- Fichiers source pertinents : `lib/scoring/questions.ts`, `app/diagnostic/`
- **Total estimé** : ~1 700 tokens

## 7. Definition of Output Done (DoOD)

- [ ] Code + lint passing (Biome)
- [ ] Tests E2E Playwright couvrant les 7 critères d'acceptation
- [ ] **EARS lint : 0 violation** (skill `ears-validator`)
- [ ] SPEC mise à jour si écart (Drift Lock)
- [ ] Annotations `@spec SPEC-001-4-wizard-ui` + `@verified-by` posées dans `app/diagnostic/` et `components/wizard/`
- [ ] Code review passée
- [ ] Gouvernance RGAA vérifiée (accessibilité wizard : focus management, ARIA roles sur les étapes, contraste)
