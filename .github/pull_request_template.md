## Intent & SPEC

- **Intent parent** : `INTENT-00X-…`
- **SPEC(s) couverte(s)** : `SPEC-00X-N-…`

## Changements

<!-- Description courte des changements apportés (QUOI et POURQUOI) -->

## Checklist SDD Mode — Drift Lock

### Spécification
- [ ] Une SPEC validée (SQS ≥ 4/5) couvre chaque changement fonctionnel
- [ ] La SPEC est mise à jour si le code s'écarte du plan initial
- [ ] Les annotations `@spec`, `@intent`, `@governance` sont posées dans le code

### Tests
- [ ] Tests Vitest ajoutés/mis à jour pour toute modification de `lib/scoring/`
- [ ] Tests Playwright ajoutés/mis à jour pour tout nouveau flux UI
- [ ] `pnpm test` passe localement

### Gouvernance Tier 1
- [ ] **AI-ACT** : aucun composant IA activé en v1 (LLM différé — ADR-001)
- [ ] **RGPD** : aucune donnée nominative dans les réponses de diagnostic
- [ ] **RGAA** : composants UI testés accessibilité (si applicable)
- [ ] **RGESN** : index DB ajoutés pour toute nouvelle requête filtrée fréquemment

### Sécurité & RLS
- [ ] Aucun secret commité (pas de clé Supabase/Anthropic en clair)
- [ ] Toutes les queries filtrent par `organization_id` explicitement
- [ ] RLS activée sur toute nouvelle table

### Drift Check
- [ ] `/sdd drift-check` exécuté — résultat : **OK**
- [ ] `CHANGELOG-ARTEFACTS.md` mis à jour

## Type de changement

- [ ] Nouvelle fonctionnalité (feat)
- [ ] Correction de bug (fix)
- [ ] Refactoring (refactor)
- [ ] Documentation / artefacts SDD (docs)
- [ ] Infrastructure / CI (ci)

## Captures / Demo

<!-- Optionnel : screenshot, lien preview Vercel, sortie de test -->
