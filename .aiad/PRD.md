# PRD : AIAD Plateforme — Diagnostic Organisationnel Humain/IA

> Source de vérité produit. Auteur : Steeve — Date : 2026-05-20

## 1. Contexte et Problème

**Situation actuelle** : Les frameworks techniques pour développer avec des agents IA (Spec Driven Development, etc.) existent et permettent d'industrialiser le cycle de développement. Mais aucun modèle organisationnel ne permet de les orchestrer. Les DSI et managers ne savent pas comment structurer leurs équipes hybrides humain/IA, quels rôles créer, quelles compétences développer. Aujourd'hui, la réponse par défaut est de distribuer des tokens — sans repenser l'organisation.

**Qui ressent le problème** : Les DSI (incapables de projeter une org cible et de mesurer le ROI), les managers (perdus entre reporting, compétences à restructurer et doute sur leur propre rôle), les devs seniors (qui cherchent une démarche structurée après avoir testé le vibe coding), les PMs, QA et architectes (dont les repères métier s'effondrent dans le contexte humain/agent).

**Impact business** : Coûts tokens en hausse sans impact visible, ROI non mesurable, équipes qui n'accélèrent pas alors que la concurrence dégage des features à la chaîne, dette technique qui explose faute de gouvernance, turnover de sens pour les managers et seniors.

## 2. North Star / Product Goal

Les DSI et Dev ont repris le contrôle sur leur delivery.

## 3. Personas et Use Cases

| Persona | Besoin | Résultat attendu |
|---------|--------|------------------|
| **Sophie** — DSI | Comprendre où en est son organisation et quels leviers actionner | Dispose d'un diagnostic consolidé + plan d'action en < 5 min de lecture |
| **Gérard** — Dev senior | Structurer et industrialiser sa pratique des agents IA | Sait exactement quels prochains pas concrets mettre en œuvre, installe SDD Mode |
| **Paul** — Manager | Rendre compte du ROI IA à sa DSI, restructurer les compétences de son équipe | Comprend comment traduire l'activité agent en indicateurs lisibles |
| **Marcelle** — Product Manager | Délivrer aussi vite que la concurrence sans sacrifier la qualité | Son équipe adopte SDD Mode et son backlog s'écoule |
| **Martine** — QA senior | Retrouver des repères de validation dans un contexte humain/agent flou | Dispose d'un cadre de validation adapté aux pratiques hybrides |
| **Roger** — Architecte senior | Contenir l'explosion des PRs et la dette technique | Bénéficie d'une gouvernance technique adaptée aux agents IA |

**Personas primaires v1 : Sophie et Gérard.**

## 4. Outcome Criteria (Mesurables)

| Critère | Baseline | Cible | Méthode |
|---------|----------|-------|---------|
| Compréhension DSI de l'intérêt AIAD/SDD Mode | 0 % (pas de support structuré) | 80 % comprennent en < 5 min | Sondage de sortie post-visite plateforme |
| Conversion Dev senior → installation SDD Mode | 0 % (découverte non guidée) | 80 % installent après découverte | Tracking lien install depuis la plateforme |

## 5. Périmètre

### In Scope
- **Diagnostic équipe** : outil permettant à un dev senior ou coach d'équipe de positionner son équipe sur ses pratiques de delivery avec agents IA — résultats personnalisés + pistes concrètes actionnables (s'appuyant en priorité sur l'écosystème AIAD/SDD Mode, sans exclusivité)
- **Diagnostic DSI** : agrégation des diagnostics équipes remontés par les devs seniors / coachs — vue consolidée pour la DSI avec pistes actionnables
- Les deux diagnostics sont **gratuits**
- Base existante : ébauche du diagnostic équipe disponible sur aiad.ovh/diagnostic/

### Out of Scope (délibéré)
- **Formation** — hors v1 : trop tôt, le modèle pédagogique n'est pas validé
- **Marketplace de coachs** — hors v1 : le réseau est à construire (1 coach à date)
- **Intégrations d'outils tiers** — hors v1 : complexité inutile avant validation du diagnostic core

## 6. User Stories (Prioritaires)

```
US-001 | MUST   | Gérard peut réaliser un diagnostic de son équipe pour identifier ses prochains pas concrets → Outcome : 80 % installent SDD Mode après découverte
US-002 | MUST   | Sophie peut consulter un diagnostic DSI consolidé pour comprendre où en est sa DSI → Outcome : 80 % comprennent l'intérêt AIAD/SDD Mode en < 5 min
US-003 | MUST   | Sophie voit les diagnostics de ses équipes agrégés en une vue unique pour décider des priorités → Outcome : plan d'action lisible en < 30 min
US-004 | SHOULD | Gérard accède à des recommandations concrètes AIAD/SDD Mode post-diagnostic pour passer à l'action immédiatement → Outcome : zéro friction entre diagnostic et premier pas
US-005 | SHOULD | Paul consulte le diagnostic de son équipe pour préparer son reporting vers Sophie → Outcome : indicateurs ROI lisibles sans expertise technique IA
US-006 | COULD  | Martine utilise les résultats du diagnostic pour recadrer ses pratiques QA dans un contexte hybride humain/agent → Outcome : référentiel de validation adapté
```

## 7. Trade-offs et Décisions Clés

| Décision | Raison | Coût / Bénéfice |
|----------|--------|-----------------|
| Diagnostics gratuits | Maximiser l'adoption et valider le modèle avant monétisation | Pas de revenu direct v1 — investissement en acquisition et validation |
| Réseau de coachs minimal (1 coach en v1) | Le réseau n'existe pas encore — construire le modèle avant de scaler | Risque de surcharge du premier coach, mais permet d'itérer vite sur le modèle |
| Pas d'intégration outils tiers | Rester focus sur le diagnostic core | Recommandations moins riches, mais expérience plus cohérente et maintenable |
| Recommandations AIAD/SDD Mode en priorité, non exclusives | Crédibilité et adoption — ne pas apparaître comme un tunnel commercial | Moins de lock-in, plus de confiance |

## 8. Dépendances et Risques

**Dépendances externes** :
- Ébauche diagnostic équipe (aiad.ovh/diagnostic/) — à valider comme base v1
- Réseau de coachs AIAD à construire (1 coach identifié : Steeve)

**Risques** :

| Risque | Mitigation |
|--------|-----------|
| Les devs seniors n'adoptent pas le rôle de remontée diagnostic | Rendre le diagnostic utile *pour Gérard d'abord* — la remontée DSI est un bénéfice secondaire naturel |
| Maturité insuffisante du diagnostic équipe existant | Audit de l'ébauche avant construction — ne pas partir de zéro si utilisable |
| Message trop complexe pour convaincre Sophie en < 5 min | Tester la page d'entrée DSI avec 3-5 profils cibles avant lancement |
| Opacité sur qui est derrière AIAD et qui intervient | Transparence explicite sur le profil du/des coachs dès la v1 |
| Réseau de coachs inexistant = dépendance critique sur une seule personne | Documenter le modèle coach pour permettre l'onboarding rapide de nouveaux coachs en v2 |

## 9. Évolution Prévue (v2)

- **Marketplace de coachs AIAD** : mise en relation DSI/équipes avec des coachs certifiés — réseau à construire en parallèle de la v1
- **Formation** : parcours structurés pour chaque persona (Sophie, Paul, Gérard…) basés sur les gaps identifiés par les diagnostics
