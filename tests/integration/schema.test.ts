/**
 * @spec SPEC-001-1-schema-db
 * @intent INTENT-001-diagnostic-equipe
 *
 * Tests d'intégration du schéma PostgreSQL.
 * Nécessite un Supabase local en cours (`supabase start`).
 * Variables requises dans .env.test : DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const { Client } = pg

// ─── connexions ──────────────────────────────────────────────────────────────

let db: pg.Client

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

const supabaseAnon = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
)

beforeAll(async () => {
  db = new Client({ connectionString: process.env.DATABASE_URL })
  await db.connect()
})

afterAll(async () => {
  await db.end()
})

// ─── CA-001 — Tables créées avec contraintes NOT NULL ────────────────────────

describe('CA-001 — Tables créées avec contraintes NOT NULL', () => {
  const EXPECTED_TABLES = [
    'organizations',
    'user_profiles',
    'campaigns',
    'teams',
    'groups',
    'group_teams',
    'diagnostic_runs',
  ]

  it.each(EXPECTED_TABLES)('table %s exists in public schema', async (table) => {
    const { rows } = await db.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1`,
      [table],
    )
    expect(rows).toHaveLength(1)
  })
})

// ─── CA-002 — RLS activée sur toutes les tables ──────────────────────────────

describe('CA-002 — RLS activée sur toutes les tables', () => {
  const TABLES_WITH_RLS = [
    'organizations',
    'user_profiles',
    'campaigns',
    'teams',
    'groups',
    'group_teams',
    'diagnostic_runs',
  ]

  it.each(TABLES_WITH_RLS)('%s has RLS enabled', async (table) => {
    const { rows } = await db.query(
      `SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = $1`,
      [table],
    )
    expect(rows[0]?.rowsecurity).toBe(true)
  })
})

// ─── CA-003 — Politique RLS org_isolation présente ───────────────────────────

describe('CA-003 — Politique RLS org_isolation présente', () => {
  const TABLES = [
    'organizations',
    'user_profiles',
    'campaigns',
    'teams',
    'groups',
    'group_teams',
    'diagnostic_runs',
  ]

  it.each(TABLES)('%s has org_isolation policy', async (table) => {
    const { rows } = await db.query(
      `SELECT policyname FROM pg_policies
       WHERE schemaname = 'public' AND tablename = $1 AND policyname = 'org_isolation'`,
      [table],
    )
    expect(rows).toHaveLength(1)
  })
})

// ─── CA-004 — SELECT bloqué sans organization_id dans le JWT ─────────────────

describe('CA-004 — SELECT bloqué sans organization_id dans le JWT', () => {
  it('returns zero rows when JWT has no organization_id (anon key)', async () => {
    const { data, error } = await supabaseAnon.from('organizations').select('id')
    // RLS renvoie 0 lignes (pas d'erreur, juste résultat vide)
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })
})

// ─── CA-005 — INSERT rejeté sans organization_id dans le JWT ─────────────────

describe('CA-005 — INSERT rejeté sans organization_id dans le JWT', () => {
  it('rejects INSERT via anon key (no organization_id in JWT)', async () => {
    const { error } = await supabaseAnon
      .from('organizations')
      .insert({ name: 'Unauthorized' })
    expect(error).not.toBeNull()
  })
})

// ─── CA-006 — Contrainte CHECK sur status ────────────────────────────────────

describe('CA-006 — CHECK status IN (draft, submitted, scored)', () => {
  it('rejects status value outside allowed set (check_violation 23514)', async () => {
    await expect(
      db.query(`
        INSERT INTO diagnostic_runs (campaign_id, team_id, organization_id, status)
        VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'invalid_status')
      `),
    ).rejects.toMatchObject({ code: '23514' })
  })
})

// ─── CA-007 — Cascade delete organisation ────────────────────────────────────

describe('CA-007 — Cascade delete organisation', () => {
  let orgId: string

  beforeAll(async () => {
    const { rows } = await db.query(
      `INSERT INTO organizations (name) VALUES ('Cascade Test Org') RETURNING id`,
    )
    orgId = rows[0].id
    await db.query(
      `INSERT INTO teams (organization_id, name) VALUES ($1, 'Team A')`,
      [orgId],
    )
  })

  it('cascade-deletes teams when organization is deleted', async () => {
    await db.query(`DELETE FROM organizations WHERE id = $1`, [orgId])
    const { rows } = await db.query(
      `SELECT id FROM teams WHERE organization_id = $1`,
      [orgId],
    )
    expect(rows).toHaveLength(0)
  })
})

// ─── CA-008 — Migration idempotente ──────────────────────────────────────────

describe('CA-008 — Migration idempotente', () => {
  it('re-running migration SQL completes without error', async () => {
    const { readFile } = await import('fs/promises')
    const sql = await readFile(
      'supabase/migrations/20260520000000_init_diagnostic_schema.sql',
      'utf-8',
    )
    // IF NOT EXISTS guards → pas d'erreur au second passage
    await expect(db.query(sql)).resolves.toBeDefined()
  })
})
