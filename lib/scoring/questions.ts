/**
 * @spec SPEC-001-2-scoring-engine
 * @intent INTENT-001-diagnostic-equipe
 * @verified-by tests/unit/scoring/engine.test.ts
 *
 * Source de vérité : SPEC-001-2 §2.bis
 * Options A–D correspondent aux niveaux 1–4.
 */
import type { Dimension, Question } from "./types";

export const DIMENSIONS: Dimension[] = [
	{ id: "tools", label: "Outils & Environnement", short: "Outils" },
	{ id: "process", label: "Process de Développement", short: "Process" },
	{ id: "docs", label: "Documentation & Artefacts", short: "Documentation" },
	{ id: "quality", label: "Qualité & Tests", short: "Qualité" },
	{ id: "collab", label: "Collaboration & Rôles", short: "Collaboration" },
	{ id: "vision", label: "Vision & Stratégie", short: "Vision" },
];

export const QUESTION_COUNT = 14;

export const QUESTIONS: Question[] = [
	// ── tools (dimension 0) ─────────────────────────────────────────────────────
	{
		index: 0,
		dimension: 0,
		text: "Quels outils IA votre équipe utilise-t-elle au quotidien ?",
		options: [
			"Copilot / TabNine pour l'auto-complétion dans l'IDE",
			"Cursor / Windsurf / ChatGPT pour générer des blocs de code entiers",
			"Agent IA de codage (Claude Code, Codex CLI) avec MCP, fichier de config, SubAgents",
			"Agent IA orchestré par des specs formalisées (PRD → ARCHITECTURE → SPECS → Code)",
		],
	},
	{
		index: 1,
		dimension: 0,
		text: "Comment votre agent IA accède-t-il au contexte de votre projet ?",
		options: [
			"Il n'a pas de contexte spécifique, il travaille fichier par fichier",
			"On lui copie-colle du contexte dans le prompt quand nécessaire",
			"Un fichier de config (CLAUDE.md / AGENTS.md) + MCP lui donne accès au projet",
			"Plusieurs documents vivants (PRD, ARCHITECTURE, AGENT-GUIDE, SPECS) structurent systématiquement son contexte",
		],
	},
	{
		index: 2,
		dimension: 0,
		text: "Votre agent IA utilise-t-il des extensions ou des connexions à des outils externes ?",
		options: [
			"Non, juste l'auto-complétion dans l'IDE",
			"Pas vraiment, on utilise principalement le chat",
			"Oui, des MCP (Playwright, Context7, BD…) et/ou des SubAgents spécialisés",
			"Oui, un écosystème complet : MCP + SubAgents + Skills + Hooks + pipeline CI/CD intégré",
		],
	},
	// ── process (dimension 1) ───────────────────────────────────────────────────
	{
		index: 3,
		dimension: 1,
		text: "Comment une nouvelle fonctionnalité est-elle développée ?",
		options: [
			"Le dev code manuellement avec aide IA pour compléter le code",
			"On décrit la fonctionnalité en langage naturel et l'IA génère le code",
			"On prépare le contexte (docs, règles) puis on guide l'agent étape par étape",
			"On rédige une SPEC formalisée, l'agent planifie puis implémente, on valide",
		],
	},
	{
		index: 4,
		dimension: 1,
		text: "Combien de fonctionnalités développez-vous en parallèle avec l'IA ?",
		options: [
			"L'IA assiste sur le fichier en cours, pas de notion de « fonctionnalité »",
			"On essaie de faire tout d'un coup (approche « Big Bang »)",
			"On découpe en tâches, mais sans formalisme strict",
			"Strictement une fonctionnalité à la fois : Spec → Implémentation → Validation → Commit",
		],
	},
	{
		index: 5,
		dimension: 1,
		text: "Que se passe-t-il quand l'IA génère du code incorrect ?",
		options: [
			"On corrige manuellement",
			"On re-prompte jusqu'à obtenir quelque chose qui marche",
			"On ajuste le contexte/prompt et on documente l'erreur dans le fichier de config",
			"On analyse si le problème vient de la SPEC, on corrige la source, et on ajoute une règle préventive",
		],
	},
	// ── docs (dimension 2) ──────────────────────────────────────────────────────
	{
		index: 6,
		dimension: 2,
		text: "Quelle documentation guide votre développement IA ?",
		options: [
			"Pas de documentation spécifique à l'IA",
			"Des prompts sauvegardés ou des notes informelles",
			"Un CLAUDE.md / AGENTS.md avec des règles, patterns et vocabulaire métier",
			"Un écosystème complet : PRD → ARCHITECTURE → AGENT-GUIDE → SPECS par tâche",
		],
	},
	{
		index: 7,
		dimension: 2,
		text: "Vos documents de développement sont-ils mis à jour régulièrement ?",
		options: [
			"Nous n'avons pas de docs spécifiques à l'IA",
			"Rarement, on se concentre sur le code",
			"Le fichier de config agent est enrichi à chaque itération",
			"Tous les artefacts sont des documents vivants mis à jour systématiquement (rétrospective IA incluse)",
		],
	},
	// ── quality (dimension 3) ───────────────────────────────────────────────────
	{
		index: 8,
		dimension: 3,
		text: "Comment gérez-vous la qualité du code généré par l'IA ?",
		options: [
			"On vérifie manuellement le code suggéré avant de l'accepter",
			"On teste manuellement en lançant l'application",
			"L'agent génère des tests, on les valide et on exécute",
			"Les tests attendus sont spécifiés dans la SPEC, couverture >80% visée, revue automatique par SubAgent",
		],
	},
	{
		index: 9,
		dimension: 3,
		text: "Mesurez-vous des métriques liées à l'utilisation de l'IA ?",
		options: [
			"Non",
			"Pas formellement, on a une idée du gain de temps",
			"On suit quelques indicateurs (taux d'adoption, bugs)",
			"Dashboard avec vélocité, first-time success rate, couverture tests, lead time, ratio génération/correction",
		],
	},
	// ── collab (dimension 4) ────────────────────────────────────────────────────
	{
		index: 10,
		dimension: 4,
		text: "Comment les rôles sont-ils définis par rapport à l'IA ?",
		options: [
			"Les devs utilisent l'IA individuellement, pas d'impact sur les rôles",
			"Certains devs sont plus « vibe coders » que d'autres, pas de formalisme",
			"On commence à distinguer des rôles (qui prépare le contexte, qui valide)",
			"Rôles clairement définis : Product Owner, Tech Lead, Product Engineer, QA Engineer",
		],
	},
	{
		index: 11,
		dimension: 4,
		text: "Comment partagez-vous les bonnes pratiques IA dans l'équipe ?",
		options: [
			"Informellement, chacun découvre par soi-même",
			"On partage des prompts qui marchent bien",
			"On a un guide partagé et des rétrospectives incluant l'IA",
			"Rétrospectives IA dédiées, AGENT-GUIDE collaboratif, coaching hebdomadaire, métriques d'efficacité IA suivies",
		],
	},
	// ── vision (dimension 5) ────────────────────────────────────────────────────
	{
		index: 12,
		dimension: 5,
		text: "Quelle est la vision de votre équipe sur l'IA dans le développement ?",
		options: [
			"Un outil pratique pour aller plus vite sur le code",
			"Un moyen de générer du code plus rapidement",
			"Un partenaire de développement qu'il faut bien configurer et guider",
			"Un changement de paradigme : les devs deviennent des orchestrateurs stratégiques",
		],
	},
	{
		index: 13,
		dimension: 5,
		text: "Où en êtes-vous dans la gestion de la sécurité du code IA ?",
		options: [
			"On fait confiance à l'IA + revue manuelle classique",
			"On n'y pense pas vraiment, on se concentre sur le résultat",
			"Validation systématique, pas de secrets dans les prompts, scan de sécurité",
			"Agent Sécurité dédié, scan automatique post-génération, gouvernance formalisée, audit trail",
		],
	},
];
