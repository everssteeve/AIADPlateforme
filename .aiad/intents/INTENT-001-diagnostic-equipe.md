# INTENT-001-diagnostic-equipe

**Auteur** : Steeve
**Date** : 2026-05-20
**Statut** : active

---

## POURQUOI MAINTENANT

Les devs seniors n'ont pas de démarche structurée pour adopter les agents IA dans leur travail quotidien — le vibe coding non guidé est la norme. Une ébauche de diagnostic existe sur aiad.ovh/diagnostic/ et constitue une base de départ disponible dès maintenant. C'est le moment de la formaliser en produit.

## POUR QUI

Gérard — dev senior ou coach d'équipe qui souhaite structurer et industrialiser sa pratique des agents IA, et positionner son équipe sur ses pratiques de delivery.

## OBJECTIF

80 % des devs seniors qui découvrent la plateforme installent SDD Mode suite à la réalisation du diagnostic équipe.

## CONTRAINTES

- Scoring algorithmique pur en v1 — pas de LLM (voir ADR-001, différé v2)
- Données au niveau équipe/projet uniquement — pas de données nominatives (pas de RGPD lourd)
- Wizard multi-étapes avec draft persisté (reprise possible après interruption)
- Recommandations orientées AIAD/SDD Mode en priorité, non exclusives

## CRITÈRE DE DRIFT

Si le résultat affiché ne contient pas de recommandation concrète AIAD/SDD Mode → drift.

---

## SPECs liées

- [x] [SPEC-001-1](../specs/SPEC-001-1-schema-db.md) — Schéma DB diagnostic (Wave 1)
- [x] [SPEC-001-2](../specs/SPEC-001-2-scoring-engine.md) — Moteur de scoring & questions (Wave 1)
- [x] [SPEC-001-3](../specs/SPEC-001-3-api-diagnostic.md) — API routes diagnostic (Wave 2)
- [x] [SPEC-001-4](../specs/SPEC-001-4-wizard-ui.md) — Wizard UI multi-étapes (Wave 3)
- [x] [SPEC-001-5](../specs/SPEC-001-5-page-resultats.md) — Page résultats + lien SDD Mode (Wave 3)
