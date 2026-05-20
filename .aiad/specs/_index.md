# Index des SPECs

> Chaque SPEC est une spécification technique atomique liée à un Intent Statement.
> Nommage : `SPEC-NNN-[nom-court].md`
> Commande : `/sdd spec` (ajouter `--ears` pour la variante EARS) dans Claude Code

| ID | Titre | Intent parent | Format | SQS | Statut | PR |
|----|-------|---------------|--------|-----|--------|----|
| [SPEC-001-1](SPEC-001-1-schema-db.md) | Schéma DB diagnostic | INTENT-001 | EARS | 5/5 | done | — |
| [SPEC-001-2](SPEC-001-2-scoring-engine.md) | Moteur de scoring & questions | INTENT-001 | EARS | 5/5 | done | — |
| [SPEC-001-3](SPEC-001-3-api-diagnostic.md) | API routes diagnostic | INTENT-001 | EARS | À évaluer | draft | — |
| [SPEC-001-4](SPEC-001-4-wizard-ui.md) | Wizard UI multi-étapes | INTENT-001 | EARS | À évaluer | draft | — |
| [SPEC-001-5](SPEC-001-5-page-resultats.md) | Page résultats + lien SDD Mode | INTENT-001 | EARS | À évaluer | draft | — |

> Colonne **Format** : `prose` (par défaut) ou `EARS` (variante avec linter strict — cf. `spec-ears-template.md`).

## Statuts possibles

- **draft** — SPEC en cours de rédaction
- **review** — En attente de validation SQS (Execution Gate)
- **ready** — SQS >= 4/5, prête pour développement agent
- **in-progress** — Agent en cours de développement
- **validation** — Code produit, en validation QA
- **done** — Code + SPEC synchronisés, PR mergée (Drift Lock)
- **archived** — Déplacée dans `archive/`
