# ADR-001 — LLM Claude différé en v2 — scoring algorithmique en v1

Date : 2026-05-20 | Statut : Accepted

## Contexte

Le PRD prévoit des recommandations personnalisées à l'issue du diagnostic équipe. Deux approches ont été évaluées :
- **Option A** : génération des recommandations via LLM (Claude, Vercel AI SDK, async)
- **Option B** : algorithme de scoring déterministe — mapping score/dimensions → recommandations prédéfinies

## Décision

**Option B retenue pour la v1.** Le questionnaire est un quiz dont le moteur de scoring génère les recommandations sans recours à un LLM.

## Raisons

1. **Auditabilité** : un algorithme déterministe est testable unitairement et explicable à l'utilisateur — pas de boîte noire.
2. **Simplicité opérationnelle** : pas de dépendance externe (API Anthropic), pas de gestion d'async jobs, pas de coût variable à l'usage en v1.
3. **Vitesse de livraison** : l'algo peut être codé et testé sans infrastructure supplémentaire.
4. **RGPD/AI Act** : l'EU AI Act ne s'applique pas à un algorithme de scoring règle-based — le risque réglementaire LLM est écarté en v1.

## Conséquences

- `lib/scoring/` doit être rigoureusement testé (Vitest) — c'est le cœur du produit en v1.
- La structure de données (`answers` en JSONB, `recommendations` en JSONB) est conçue pour accueillir les recommandations LLM en v2 sans migration de schéma.
- En v2, Vercel AI SDK + Anthropic Claude sera activé en remplacement ou complément du scoring algorithmique. Les CGU devront mentionner ce traitement dès la v1.
