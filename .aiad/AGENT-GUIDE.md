# AGENT-GUIDE — AIAD Plateforme

> Ce fichier est le **contexte permanent** de l'agent IA.
> Il est injecté dans CHAQUE session de développement.
> Le maintenir à jour est une responsabilité de l'Agents Engineer (AE).
> Framework : AIAD SDD Mode v1.12

---

## IDENTITÉ DU PROJET

**Nom** : AIAD Plateforme
**Description** : Plateforme de diagnostic organisationnel humain/IA — aide les DSI et devs seniors à évaluer la maturité de leurs équipes en delivery avec agents IA et à identifier des actions concrètes.
**Domaine métier** : Transformation organisationnelle, outillage IA pour équipes tech
**Mission** : Permettre à 80 % des DSI de comprendre l'intérêt d'AIAD/SDD Mode en < 5 min, et à 80 % des devs seniors de passer à l'installation de SDD Mode après découverte de la plateforme.

---

## DOCUMENTATION DE RÉFÉRENCE

| Document | Chemin | Mode d'injection |
|----------|--------|-----------------|
| PRD | `.aiad/PRD.md` | Cadrage uniquement |
| Architecture | `.aiad/ARCHITECTURE.md` | Condensé permanent (§11) |
| SPEC active | `.aiad/specs/[SPEC-XXX].md` | Par tâche uniquement |
| Index SPECs | `.aiad/specs/_index.md` | Planification |
| Gouvernance | `.aiad/gouvernance/` | Permanent (Tier 1, veto) |
| ADR-001 | `.aiad/adrs/ADR-001-llm-differe-v2.md` | Si contexte LLM/scoring |

---

## STACK TECHNIQUE (Référence Rapide)

```
Runtime     : Node.js 20 LTS
Framework   : Next.js 15 — App Router, Server Components par défaut
Language    : TypeScript strict
Database    : Supabase (PostgreSQL 16) — RLS par organization_id
Auth        : Supabase Auth — email/password v1, SSO OIDC v2
Déploiement : Vercel
Validation  : Zod (toutes les API Routes)
Tests       : Vitest (unit, lib/scoring) + Playwright (e2e wizard + dashboard)
Style       : Tailwind CSS v4
Linter      : Biome (remplace ESLint + Prettier)
LLM         : NON activé en v1 — scoring algorithmique pur (voir ADR-001)
```

---

## MODÈLE DE DONNÉES (Référence Rapide)

```
organization
  ├── users          (roles: admin | contributor | viewer)
  ├── groups         (périmètres d'équipes, définis par admin/DSI)
  │     └── group_teams
  ├── teams
  │     └── diagnostic_runs
  │           ├── campaign_id, team_id
  │           ├── answers    JSONB  ← réponses wizard
  │           ├── score      JSONB  ← score par dimension
  │           ├── recommendations JSONB ← générées par lib/scoring
  │           └── status: draft | submitted | scored
  └── campaigns      (ex: "Q1 2026" — pour suivi évolution dans le temps)
```

---

## RÈGLES ABSOLUES

### TOUJOURS
- Valider les entrées avec **Zod** à l'entrée de chaque API Route
- Appliquer la **RLS Supabase** — toute query doit filtrer par `organization_id`
- Synchroniser SPEC + code dans la même PR (Drift Lock)
- Ajouter un test Vitest pour chaque modification de `lib/scoring/`
- Mettre à jour les Lessons Learned en fin d'itération
- Utiliser **Server Components** par défaut — `'use client'` uniquement si interaction browser requise

### JAMAIS
- Activer un LLM ou appel à l'API Anthropic en v1 (voir ADR-001 — différé v2)
- Committer des secrets — clés Supabase et Anthropic dans les variables d'environnement Vercel uniquement
- Modifier le schéma DB sans migration Supabase versionnée
- Merger sans que `lib/scoring/` ait 100 % de couverture sur les chemins critiques
- Exposer des données d'une organisation à une autre (violation RLS = bug critique)
- Mettre des données nominatives dans les réponses de diagnostic (données au niveau équipe/projet uniquement)

### INCERTITUDE — Dire "JNSP"
- Dire `JNSP` est un signal valide, pas un échec
- Si l'intention n'est pas formulée par un humain → demander, ne pas paraphraser
- Si un critère d'acceptation n'est pas testable → JNSP
- Dans le code : `// TODO-JNSP: <question précise pour l'humain>`
- Dans une réponse : ce qui est connu / ce qui manque / question à l'humain

---

## CONVENTIONS DE CODE

### Nommage
- **Composants React** : `PascalCase` → `DiagnosticWizard.tsx`
- **Fichiers non-composants** : `kebab-case` → `scoring-engine.ts`
- **Variables/fonctions** : `camelCase`
- **Colonnes DB** : `snake_case` → `organization_id`, `created_at`
- **Routes API** : REST, kebab-case → `/api/diagnostic-runs/[id]`

### Ordre des imports
```ts
// 1. Node built-ins
// 2. Dépendances externes (react, next, zod, @supabase/…)
// 3. Alias internes (@/lib/…, @/components/…)
// 4. Relatifs (./…)
```

### Pattern API Route standard
```ts
// app/api/campaigns/[id]/diagnostic/route.ts
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({ /* ... */ })

export async function POST(req: Request) {
  const body = schema.safeParse(await req.json())
  if (!body.success) {
    return Response.json({ error: body.error.flatten() }, { status: 400 })
  }
  const supabase = createClient()
  // logique métier...
}
```

### Pattern scoring (lib/scoring)
```ts
// Fonctions pures — sans effet de bord — testables unitairement
export function computeScore(answers: DiagnosticAnswers): DiagnosticScore {
  // ...
}

export function generateRecommendations(score: DiagnosticScore): Recommendation[] {
  // mapping déterministe score → recommandations
}
```

---

## VOCABULAIRE MÉTIER

| Terme métier | Définition | Terme à éviter |
|--------------|------------|----------------|
| **Diagnostic équipe** | Évaluation de la maturité d'une équipe en delivery avec agents IA, réalisée par un dev senior ou coach | "audit", "questionnaire" seul |
| **Diagnostic DSI** | Vue agrégée des diagnostics équipes pour une organisation — produite pour la DSI | "rapport DSI" |
| **Campaign** | Période de diagnostic (ex: "Q1 2026") — permet le suivi de l'évolution dans le temps | "batch", "session" |
| **Group** | Périmètre d'équipes défini par la DSI pour regrouper des équipes par domaine ou budget | "département", "BU" seul |
| **Scoring** | Calcul algorithmique déterministe du niveau de maturité par dimension | "analyse IA", "évaluation LLM" |
| **Recommandation** | Piste d'action concrète générée par le moteur de scoring, orientée AIAD/SDD Mode | "conseil", "suggestion" |
| **Admin** | Rôle DSI — gère les campagnes, groupes, voit tous les diagnostics de l'organisation | "super-user" |
| **Contributor** | Rôle dev senior / coach — soumet les diagnostics équipe | "user", "membre" |

---

## PATTERNS DE DÉVELOPPEMENT

### Pattern Wizard Multi-Étapes (draft persisté)
```ts
// Chaque étape du wizard sauvegarde un draft en DB
// status: 'draft' → 'submitted' à la soumission finale
// Permet la reprise après interruption
async function saveDraftStep(runId: string, step: number, answers: Partial<DiagnosticAnswers>) {
  const supabase = createClient()
  await supabase
    .from('diagnostic_runs')
    .update({ answers: { ...existingAnswers, ...answers }, current_step: step })
    .eq('id', runId)
}
```

### Pattern Vue DSI Agrégée
```ts
// Toujours agréger depuis diagnostic_runs côté serveur
// Ne jamais calculer les agrégats côté client
async function getGroupScore(groupId: string, campaignId: string) {
  // Query Supabase avec JOIN groups → teams → diagnostic_runs
  // RLS garantit l'isolation organization_id automatiquement
}
```

---

## ANTI-PATTERNS

| Anti-pattern | Pourquoi éviter | Alternative |
|--------------|-----------------|-------------|
| Logique de scoring dans un composant React | Impossible à tester unitairement, couplage fort UI/métier | Extraire dans `lib/scoring/engine.ts` |
| Query sans filtre `organization_id` explicite | Fuite de données inter-organisations (même avec RLS) | Toujours filtrer explicitement + laisser RLS comme filet |
| `'use client'` par défaut | Perd les bénéfices RSC, augmente le bundle client | Server Component par défaut, `'use client'` uniquement si nécessaire |
| Recommandations hardcodées dans les composants | Couplage fort, impossible à faire évoluer | Centralisées dans `lib/scoring/recommendations.ts` |
| Appel direct à l'API Anthropic en v1 | Décision différée à v2 (voir ADR-001) | Scorer algorithmiquement, préparer l'interface pour v2 |

---

## LESSONS LEARNED

> Section mise à jour à chaque fin d'itération (`/aiad retro`).

| Date | Erreur agent | Correction | Impact |
|------|-------------|------------|--------|
| 2026-05-20 | `CREATE POLICY` sans `IF NOT EXISTS` → migration non idempotente (erreur 42710 au second passage) | Encapsuler chaque `CREATE POLICY` dans `DO $$ BEGIN … EXCEPTION WHEN duplicate_object THEN NULL; END $$;` | CA-008 corrigé, migration idempotente vérifiée |
| 2026-05-20 | Vitest `envFiles` option inopérante pour charger `.env.test` | Utiliser `loadEnv(mode, process.cwd(), '')` de Vite dans `vitest.config.ts` + lancer avec `NODE_ENV=test` | Tests d'intégration opérationnels |

---

## HUMAN LEARNINGS

> Écarts entre l'intention humaine exprimée et la livraison réelle.

| Date | Intention exprimée | Résultat obtenu | Apprentissage |
|------|--------------------|-----------------|---------------|
| — | — | — | — |
