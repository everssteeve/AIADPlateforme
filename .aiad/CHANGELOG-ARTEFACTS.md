# Changelog des Artefacts AIAD

> Ce fichier trace les mises à jour significatives des artefacts SDD Mode.
> Il permet de vérifier la synchronisation artefacts/code lors du Drift Check.

## Format

```
## [Date] — [Artefact] — [Type de changement]

**Auteur** : [Qui]
**Raison** : [Pourquoi cette mise à jour]
**Impact** : [SPECs ou code affectés]
```

---

<!-- Ajoutez vos entrées ci-dessous, les plus récentes en haut -->

## 2026-05-20 — SPEC-001-1-schema-db — Première livraison

**Auteur** : Agent (Steeve PE)
**Raison** : Exécution de SPEC-001-1 (SQS 5/5, Gate ouverte) — schéma DB fondation de l'INTENT-001
**Impact** :
- `supabase/migrations/20260520000000_init_diagnostic_schema.sql` créé (7 tables, 7 RLS policies, 9 index)
- `tests/integration/schema.test.ts` créé (26 tests, 8 CAs couverts — 26/26 ✅)
- `package.json` + `vitest.config.ts` + `.gitignore` initialisés
- `.aiad/ARCHITECTURE.md` : §9 Protection des données personnelles (RGPD) ajouté
- `.aiad/AGENT-GUIDE.md` : 2 Lessons Learned ajoutées (CREATE POLICY idempotence, Vitest envFiles)
- `.aiad/specs/SPEC-001-1-schema-db.md` : statut → validation, §2 Output clarifié
- `.aiad/specs/_index.md` : statut SPEC-001-1 → validation

**Remédiation gouvernance intégrée** :
- RGESN 7.x : 9 index ajoutés (organization_id, campaign_id, team_id, status)
- RGPD Art. 5.1.e : durée de rétention documentée (migration + ARCHITECTURE.md)
- RGPD Art. 28 : tableau sous-traitants Supabase/Vercel dans ARCHITECTURE.md §9
