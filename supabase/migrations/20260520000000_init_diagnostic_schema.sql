-- @spec SPEC-001-1-schema-db
-- @intent INTENT-001-diagnostic-equipe
-- @governance AIAD-RGPD,AIAD-RGESN
--
-- Base légale RGPD : Art. 6.1.b — exécution du contrat (accès à la plateforme de diagnostic)
-- Finalité : Diagnostic de maturité IA des équipes tech
-- Durée de conservation : durée du compte actif + 3 ans après désactivation
-- Sous-traitant : Supabase (voir ARCHITECTURE.md §RGPD)

-- ─────────────────────────────────────────────
-- 1. ORGANIZATIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  domain     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "org_isolation" ON organizations
    USING (id = (auth.jwt() ->> 'organization_id')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────
-- 2. USER PROFILES (extension de auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role            text NOT NULL CHECK (role IN ('admin', 'contributor', 'viewer')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "org_isolation" ON user_profiles
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RGESN 7.x — index sur FK fréquemment filtrée
CREATE INDEX IF NOT EXISTS user_profiles_org_idx ON user_profiles (organization_id);

-- ─────────────────────────────────────────────
-- 3. CAMPAIGNS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  period          text        NOT NULL,
  created_by      uuid        NOT NULL REFERENCES user_profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "org_isolation" ON campaigns
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS campaigns_org_idx ON campaigns (organization_id);

-- ─────────────────────────────────────────────
-- 4. TEAMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "org_isolation" ON teams
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS teams_org_idx ON teams (organization_id);

-- ─────────────────────────────────────────────
-- 5. GROUPS (périmètres DSI)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "org_isolation" ON groups
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS groups_org_idx ON groups (organization_id);

-- ─────────────────────────────────────────────
-- 6. GROUP_TEAMS (many-to-many)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_teams (
  group_id uuid NOT NULL REFERENCES groups(id)  ON DELETE CASCADE,
  team_id  uuid NOT NULL REFERENCES teams(id)   ON DELETE CASCADE,
  PRIMARY KEY (group_id, team_id)
);

ALTER TABLE group_teams ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- RLS via jointure sur groups (isolation par organization_id)
  CREATE POLICY "org_isolation" ON group_teams
    USING (
      group_id IN (
        SELECT id FROM groups
        WHERE organization_id = (auth.jwt() ->> 'organization_id')::uuid
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS group_teams_team_idx ON group_teams (team_id);

-- ─────────────────────────────────────────────
-- 7. DIAGNOSTIC_RUNS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diagnostic_runs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid        NOT NULL REFERENCES campaigns(id)     ON DELETE CASCADE,
  team_id         uuid        NOT NULL REFERENCES teams(id)         ON DELETE CASCADE,
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  answers         jsonb       NOT NULL DEFAULT '{}',
  score           jsonb,
  recommendations jsonb,
  current_step    integer     NOT NULL DEFAULT 0,
  status          text        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft', 'submitted', 'scored')),
  submitted_by    uuid        REFERENCES user_profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE diagnostic_runs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "org_isolation" ON diagnostic_runs
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RGESN 7.x — index sur colonnes filtrées fréquemment
CREATE INDEX IF NOT EXISTS diagnostic_runs_org_idx      ON diagnostic_runs (organization_id);
CREATE INDEX IF NOT EXISTS diagnostic_runs_campaign_idx ON diagnostic_runs (campaign_id);
CREATE INDEX IF NOT EXISTS diagnostic_runs_team_idx     ON diagnostic_runs (team_id);
CREATE INDEX IF NOT EXISTS diagnostic_runs_status_idx   ON diagnostic_runs (status);
