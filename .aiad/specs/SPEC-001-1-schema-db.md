# SPEC-001-1-schema-db — variante EARS

**Intent parent** : INTENT-001-diagnostic-equipe
**Auteur** : Steeve
**Date** : 2026-05-20
**Statut** : done
**Format** : EARS
**SQS** : 5/5

---

## 1. Contexte

Les devs seniors n'ont pas de démarche structurée pour adopter les agents IA. La plateforme fournit un diagnostic équipe wizard qui nécessite un modèle de données persisté. Ce schéma est la fondation de toutes les SPECs de l'INTENT-001 — il définit les tables, contraintes et politiques RLS qui garantissent l'isolation des données par organisation.

## 2. Comportement Attendu

### Input

Migration Supabase SQL (fichier `supabase/migrations/YYYYMMDD_init_diagnostic_schema.sql`).

### Processing

Création des tables dans l'ordre de dépendance (clés étrangères), activation des RLS policies, création des index de performance.

### Output

Schéma PostgreSQL opérationnel avec 7 tables, RLS activée sur toutes, 9 index de performance (colonnes FK fréquemment filtrées — RGESN 7.x), migrations rejouables (idempotentes : `IF NOT EXISTS` pour tables/index, `DO $$ EXCEPTION WHEN duplicate_object` pour les policies RLS).

### Cas limites

- Un utilisateur sans `organization_id` dans son JWT tente d'accéder à un diagnostic → RLS retourne 0 lignes.
- Un `diagnostic_run` est inséré avec un `status` invalide (hors `draft|submitted|scored`) → contrainte CHECK rejette l'insertion.
- Suppression d'une `organization` → cascade sur `campaigns`, `teams`, `groups`, `diagnostic_runs`.
- Deux équipes dans deux organisations différentes ont le même `name` → autorisé (unicité par `organization_id`, pas globale).

## 3. Critères d'Acceptation (EARS)

### CA-001 — Tables créées avec contraintes NOT NULL

> Pattern : Ubiquitous

`The Supabase migration SHALL create the tables organizations, user_profiles, campaigns, teams, groups, group_teams, and diagnostic_runs with all NOT NULL constraints and foreign key references declared in the schema below (§4).`

- [x] Implémenté — `supabase/migrations/20260520000000_init_diagnostic_schema.sql`
- [x] Testé : `tests/integration/schema.test.ts::tables-exist`

### CA-002 — RLS activée sur toutes les tables

> Pattern : Ubiquitous

`The Supabase migration SHALL enable Row Level Security on every table listed in §4.`

- [x] Implémenté — `ALTER TABLE … ENABLE ROW LEVEL SECURITY` sur les 7 tables
- [x] Testé : `tests/integration/schema.test.ts::rls-enabled`

### CA-003 — Politique RLS restreignant l'accès par organisation

> Pattern : Ubiquitous

`The Supabase migration SHALL create a RLS policy on every table restricting SELECT, INSERT, UPDATE, and DELETE to rows where organization_id matches the value of auth.jwt() ->> 'organization_id'.`

- [x] Implémenté — policy `org_isolation` sur les 7 tables
- [x] Testé : `tests/integration/schema.test.ts::rls-cross-org-isolation`

### CA-004 — SELECT bloqué sans organization_id dans le JWT

> Pattern : Unwanted behaviour

`IF a SELECT query is executed with a JWT that does not contain the organization_id claim, THEN the RLS policy SHALL return zero rows.`

- [x] Implémenté — couvert par les policies `org_isolation`
- [x] Testé : `tests/integration/schema.test.ts::rls-missing-claim-select`

### CA-005 — INSERT rejeté sans organization_id dans le JWT

> Pattern : Unwanted behaviour

`IF a database INSERT is executed with a JWT that does not contain the organization_id claim, THEN the RLS policy SHALL reject the operation with PostgreSQL error code 42501.`

- [x] Implémenté — couvert par les policies `org_isolation`
- [x] Testé : `tests/integration/schema.test.ts::rls-missing-claim-insert`

### CA-006 — Contrainte CHECK sur status

> Pattern : Unwanted behaviour

`IF an INSERT or UPDATE sets diagnostic_runs.status to a value outside ('draft', 'submitted', 'scored'), THEN the database SHALL reject the operation with PostgreSQL error code 23514.`

- [x] Implémenté — `CHECK (status IN ('draft', 'submitted', 'scored'))`
- [x] Testé : `tests/integration/schema.test.ts::status-check-constraint`

### CA-007 — Cascade sur suppression d'organisation

> Pattern : Event-driven

`WHEN an organization row is deleted, the database SHALL cascade-delete all dependent rows in campaigns, teams, groups, group_teams, and diagnostic_runs belonging to that organization.`

- [x] Implémenté — `ON DELETE CASCADE` sur toutes les FK vers `organizations`
- [x] Testé : `tests/integration/schema.test.ts::cascade-delete`

### CA-008 — Migration idempotente

> Pattern : Ubiquitous

`The Supabase migration SHALL complete without error when executed a second time against a database that already contains the schema (idempotent via IF NOT EXISTS guards).`

- [x] Implémenté — `CREATE TABLE IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS`
- [x] Testé : `tests/integration/schema.test.ts::migration-idempotent`

## 4. Interface / API

```sql
-- organizations
CREATE TABLE IF NOT EXISTS organizations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  domain        text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- users (extension de auth.users Supabase)
CREATE TABLE IF NOT EXISTS user_profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role            text NOT NULL CHECK (role IN ('admin', 'contributor', 'viewer')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  period          text NOT NULL,  -- ex: "Q1 2026"
  created_by      uuid NOT NULL REFERENCES user_profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- teams
CREATE TABLE IF NOT EXISTS teams (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- groups (périmètres DSI)
CREATE TABLE IF NOT EXISTS groups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- group_teams (many-to-many)
CREATE TABLE IF NOT EXISTS group_teams (
  group_id  uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  team_id   uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, team_id)
);

-- diagnostic_runs
CREATE TABLE IF NOT EXISTS diagnostic_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  team_id         uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  answers         jsonb NOT NULL DEFAULT '{}',
  score           jsonb,
  recommendations jsonb,
  current_step    integer NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'submitted', 'scored')),
  submitted_by    uuid REFERENCES user_profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

## 5. Dépendances

- Supabase projet configuré avec Auth activé
- Aucune SPEC parente

## 6. Estimation Context Engineering Budget

- AGENT-GUIDE (condensé §11 ARCHITECTURE) : ~400 tokens
- Cette SPEC : ~700 tokens
- Fichiers source pertinents : `supabase/migrations/` (vide à date)
- **Total estimé** : ~1 100 tokens

## 7. Definition of Output Done (DoOD)

- [ ] Code + lint passing
- [ ] Tests d'intégration sur les 8 critères d'acceptation (Vitest + Supabase local)
- [ ] **EARS lint : 0 violation** (skill `ears-validator`)
- [ ] SPEC mise à jour si écart (Drift Lock)
- [ ] Annotations `@spec SPEC-001-1-schema-db` posées dans le fichier migration
- [ ] Code review passée
- [ ] Gouvernance vérifiée : RGPD (données comptes utilisateurs — durée de rétention à documenter)
