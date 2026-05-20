# ARCHITECTURE — AIAD Plateforme

> Contexte technique permanent. Le résumé condensé (§11) est injecté dans chaque session agent.
> Mainteneur : Steeve — Date : 2026-05-20

## 1. Principes Architecturaux

1. **Scoring déterministe et auditable** : l'algorithme de recommandation est lisible, testé unitairement, sans boîte noire.
2. **Isolation stricte par organisation** : RLS Supabase sur `organization_id` — aucune query cross-org possible.
3. **Simplicité d'abord** : aucune abstraction ou infrastructure non justifiée par un besoin réel v1. Trois lignes simples valent mieux qu'un pattern prématuré.
4. **Évolutivité du questionnaire** : la structure du quiz (questions, étapes, pondérations) est data-driven — ajout/modification sans migration de schéma.
5. **Privacy by design** : pas de données individuelles dans les diagnostics. Consentement explicite requis pour tout traitement LLM futur (v2).

## 2. Vue d'Ensemble — Request-Path

```
[Browser — Wizard multi-étapes]
   │  POST /api/campaigns/[id]/diagnostic/submit
   ▼
[Next.js 15 API Route]
   │  1. Valide payload (zod)
   │  2. Calcule score + recommandations (lib/scoring — algo pur, synchrone)
   │  3. Persiste diagnostic_run + résultats (Supabase PostgreSQL)
   │  4. Retourne résultats immédiatement (< 2s p95)
   ▼
[Browser — Page résultats]
   │  Affiche score + recommandations personnalisées
   ▼
[Dashboard DSI]
   ├── Vue campagne courante (scores par équipe)
   ├── Vue évolution inter-campagnes (delta scores)
   └── Vue par groupe/périmètre + besoins investissement
```

## 3. Stack Technique

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| **Runtime** | Node.js 20 LTS | Maturité, compatibilité Next.js, écosystème large |
| **Framework** | Next.js 15 (App Router) | Full-stack, SSR/RSC natif, API routes, déploiement Vercel trivial |
| **Language** | TypeScript strict | Type safety bout-en-bout, détection d'erreurs à la compilation |
| **Database** | Supabase (PostgreSQL 16) | RLS natif pour isolation org, Auth inclus, migration SSO triviale en v2 |
| **Auth** | Supabase Auth | Email/password v1, SSO OIDC en v2 sans changement d'infra |
| **Déploiement** | Vercel | Zero-config avec Next.js, previews automatiques, env vars sécurisées |
| **Validation** | Zod | Validation runtime + inférence de types TypeScript |
| **Tests unitaires** | Vitest | Rapide, compatible TS natif — critique pour tester lib/scoring |
| **Tests E2E** | Playwright | Validation du wizard multi-étapes et du dashboard |
| **Style** | Tailwind CSS v4 | Utility-first, cohérent avec l'écosystème Next.js |
| **Linter/Format** | Biome | Remplace ESLint + Prettier, rapide, opinionated |

**Non activé en v1, documenté en ADR-001 :** Vercel AI SDK + Anthropic Claude (LLM async pour recommandations v2).

## 4. Modèle de Données

```
organization
  ├── id, name, domain
  ├── users (rôles : admin | contributor | viewer)
  ├── groups (périmètres d'équipes définis par la DSI)
  │     └── group_teams (relation many-to-many)
  ├── teams
  │     └── diagnostic_runs
  │           ├── campaign_id
  │           ├── answers (JSONB — réponses wizard)
  │           ├── score (numérique + dimensions)
  │           ├── recommendations (JSONB — générées par lib/scoring)
  │           └── status : draft | submitted | scored
  └── campaigns
        ├── id, name, period (ex: "Q1 2026")
        └── created_by (admin)
```

**RLS Supabase** : toutes les tables filtrent sur `organization_id`. Un utilisateur ne peut lire/écrire que les données de son organisation.

## 5. Structure du Projet

```
.
├── .aiad/                          ← Artefacts SDD Mode
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── adrs/
│   └── specs/
├── app/                            ← Next.js App Router
│   ├── (auth)/                     ← login, register, reset-password
│   ├── diagnostic/                 ← wizard multi-étapes (Gérard)
│   │   └── [campaignId]/
│   │       └── [step]/
│   ├── results/[runId]/            ← résultats + recommandations équipe
│   ├── dashboard/                  ← vue DSI (Sophie)
│   │   ├── page.tsx                ← vue globale organisation
│   │   ├── campaigns/[id]/         ← vue campagne
│   │   └── groups/[id]/            ← vue périmètre + investissements
│   └── api/
│       ├── campaigns/              ← CRUD campagnes
│       ├── diagnostic/             ← submit, draft save
│       └── results/                ← lecture résultats
├── lib/
│   ├── scoring/                    ← moteur de scoring (algo pur, testé unitairement)
│   │   ├── engine.ts               ← calcul score par dimension
│   │   ├── recommendations.ts      ← mapping score → recommandations
│   │   └── questions.ts            ← définition data-driven du questionnaire
│   └── supabase/
│       ├── server.ts               ← client Supabase (Server Components / API)
│       └── client.ts               ← client Supabase (Client Components)
├── components/                     ← UI partagée
│   ├── wizard/                     ← composants wizard multi-étapes
│   ├── charts/                     ← visualisations scores / évolution
│   └── ui/                         ← primitives (boutons, forms, etc.)
└── tests/
    ├── unit/                       ← lib/scoring (Vitest)
    ├── integration/                ← API routes
    └── e2e/                        ← wizard + dashboard (Playwright)
```

## 6. Conventions de Code

### Nommage
- **Composants React** : PascalCase (`DiagnosticWizard.tsx`)
- **Fichiers non-composants** : kebab-case (`scoring-engine.ts`)
- **Variables/fonctions** : camelCase
- **Colonnes DB** : snake_case (`organization_id`, `created_at`)
- **Routes API** : REST, kebab-case (`/api/diagnostic-runs/[id]`)

### Formatting
- **Indentation** : 2 espaces
- **Line length** : 100 chars max
- **Biome** : configuration stricte, pas de prettier séparé

### Imports
```ts
// 1. Node built-ins
// 2. Dépendances externes (react, next, zod…)
// 3. Alias internes (@/lib/…, @/components/…)
// 4. Relatifs
```

### Patterns clés
- **Server Components par défaut** — `'use client'` uniquement si interaction browser requise
- **API Routes** : validation Zod en entrée, erreurs typées en sortie
- **Scoring** : fonctions pures, sans effet de bord, 100 % testées unitairement

## 7. Gestion des Erreurs

```ts
// Pattern standard API Route
export async function POST(req: Request) {
  const body = schema.safeParse(await req.json())
  if (!body.success) {
    return Response.json({ error: body.error.flatten() }, { status: 400 })
  }
  // logique métier...
}
```

Les erreurs utilisateur (validation, 404) sont gérées côté client avec des messages explicites. Les erreurs système sont loguées côté serveur (Vercel logs) sans exposition au client.

## 8. Sécurité

- **Authentification** : Supabase Auth — email/password v1, OIDC/SSO v2
- **Autorisation** : 3 rôles — `admin` (DSI : gère campagnes, groupes, voit tout), `contributor` (Dev senior : soumet diagnostics équipe), `viewer` (lecture seule)
- **Isolation données** : RLS Supabase par `organization_id` — non-négociable, testé en intégration
- **Secrets** : variables d'environnement Vercel uniquement (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`) — jamais dans le code
- **Validation inputs** : Zod à l'entrée de chaque API Route
- **RGPD** : données de diagnostic au niveau équipe/projet uniquement (pas de données nominatives). Données compte utilisateur (email) soumises aux obligations RGPD standard.
- **CGU** : mention obligatoire du traitement futur par LLM (v2) à préparer en v1

## 9. Protection des données personnelles (RGPD)

### Responsable de traitement
AIAD Plateforme — contact : evers.steeve@gmail.com

### Base légale
Art. 6.1.b RGPD — Exécution du contrat (accès à la plateforme de diagnostic)

### Données collectées
| Table | Données | Catégorie | Durée de conservation |
|-------|---------|-----------|----------------------|
| `user_profiles` | UUID lié à auth.users (email géré par Supabase Auth) | Compte utilisateur | Durée du compte + 3 ans |
| `diagnostic_runs` | Réponses wizard au niveau équipe (pas nominatif) | Diagnostic | Durée du compte + 3 ans |
| `organizations`, `campaigns`, `teams`, `groups` | Métadonnées organisation | Compte | Durée du compte + 3 ans |

### Sous-traitants

| Service | Données partagées | Localisation | Mécanisme RGPD |
|---------|------------------|--------------|----------------|
| **Supabase** | Toutes (auth + DB) | EU (AWS eu-west-1) | DPA Supabase + SCCs 2021/914 |
| **Vercel** | Logs serveur (sans données perso) | USA | SCCs 2021/914 + DPF certifié |

> ⚠️ Vérifier et signer le DPA Supabase depuis le dashboard Supabase avant la mise en production.

### Mesures techniques
- Chiffrement au repos : géré par Supabase (AES-256)
- Chiffrement en transit : TLS 1.3
- Contrôle d'accès : RLS PostgreSQL par `organization_id` sur toutes les tables
- Mots de passe : gérés par Supabase Auth (bcrypt)
- Logs : Vercel Logs — aucune donnée personnelle brute loguée

### Endpoints RGPD (à implémenter en v1 avant mise en production)
- `GET /api/gdpr/export` — Droit d'accès (Art. 15)
- `DELETE /api/gdpr/erase` — Droit à l'effacement (Art. 17)
- `POST /api/gdpr/rectify` — Droit de rectification (Art. 16)

### Politique de purge
- Purge automatique des comptes inactifs après 3 ans : à implémenter via Supabase Edge Function (cron)
- Pas de données de prod en staging/dev : pseudonymisation obligatoire

---

## 10. Performance (Budgets)

| Métrique | Budget | Monitoring |
|----------|--------|-----------|
| **Response time p95** | < 2 000 ms | Vercel Analytics |
| **Disponibilité** | 99 % | Vercel Status |
| **Volume** | ~50 diagnostics/jour | Supabase Dashboard |
| **Error rate** | < 1 % | Vercel Logs |

## 11. ADRs (Architecture Decision Records)

| ADR | Titre | Statut |
|-----|-------|--------|
| [ADR-001](adrs/ADR-001-llm-differe-v2.md) | LLM Claude différé en v2 — scoring algorithmique en v1 | Accepted |

---

## 12. Résumé condensé (pour AGENT-GUIDE)

```
Stack     : Next.js 15 + TypeScript strict + Supabase (Auth + PostgreSQL) | Déploiement : Vercel
Principes : Scoring déterministe, Isolation org (RLS), Simplicité d'abord,
            Questionnaire data-driven, Privacy by design
Patterns  : Server Components par défaut, API Routes avec Zod, fonctions pures pour le scoring
Sécurité  : Supabase Auth (email/pw v1 → SSO v2), RLS par organization_id, secrets Vercel env
Budget    : p95 < 2s, dispo 99 %, ~50 req/jour — pas de LLM en v1
Modèle    : organization → campaigns + groups → teams → diagnostic_runs → score + recommendations
ADRs      : ADR-001 (LLM différé v2)
Conventions : snake_case DB, PascalCase composants, kebab-case fichiers, Biome
```
