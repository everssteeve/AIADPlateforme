/**
 * @spec SPEC-001-2-scoring-engine
 * @spec SPEC-001-3-api-diagnostic
 * @intent INTENT-001-diagnostic-equipe
 * @verified-by tests/unit/scoring/recommendations.test.ts
 * @verified-by tests/integration/api/diagnostic.test.ts
 * @governance AIAD-RGESN
 *
 * Source de vérité : SPEC-001-2 §2.ter
 */
import { DIMENSIONS } from "./questions";
import type { DiagnosticScore, DimensionId, Recommendation } from "./types";

const GLOBAL_RECOMMENDATIONS: Record<1 | 2 | 3 | 4, string[]> = {
	1: [
		"Essayez de décrire votre prochaine fonctionnalité en langage naturel plutôt que de coder directement",
		"Testez Cursor ou Claude Code pour générer des blocs de code entiers",
		"Commencez par un petit projet pour expérimenter le vibe coding",
		"Formez-vous aux prompts efficaces pour le développement",
	],
	2: [
		"Créez un fichier CLAUDE.md avec les règles et conventions de votre projet",
		"Installez des MCP (Context7, Playwright) pour enrichir le contexte de votre agent",
		"Arrêtez le Big Bang : développez une fonctionnalité à la fois",
		"Documentez les erreurs récurrentes de l'agent pour les éviter",
		"Mettez en place des SubAgents spécialisés (Code Reviewer, Test Writer)",
	],
	3: [
		"Formalisez vos spécifications : chaque tâche devrait avoir une SPEC écrite",
		"Adoptez le workflow : PRD → ARCHITECTURE → SPECS → Implémentation → Validation",
		"Mettez en place des métriques d'efficacité IA (first-time success rate, couverture tests)",
		"Introduisez les rétrospectives IA dans vos rituels d'équipe",
		"Découvrez le framework AIAD pour structurer votre approche",
	],
	4: [
		"Félicitations ! Vous êtes dans le top <5% des organisations",
		"Optimisez vos Agents Spécialisés (Sécurité, Qualité, Documentation)",
		"Mesurez votre ROI et partagez vos résultats avec la communauté",
		"Envisagez de former d'autres équipes à votre approche",
		"Contribuez à l'évolution du framework AIAD",
	],
};

const DIMENSION_RECOMMENDATIONS: Record<DimensionId, Record<1 | 2 | 3 | 4, string>> = {
	tools: {
		1: "Explorez les agents IA de codage (Claude Code, Cursor) au-delà de la simple auto-complétion",
		2: "Configurez un fichier CLAUDE.md et connectez des MCP pour structurer le contexte de votre agent",
		3: "Complétez votre écosystème avec un pipeline de spécifications formalisées (PRD → ARCHITECTURE → SPECS)",
		4: "Votre outillage est au top ! Continuez à optimiser et partager vos configurations",
	},
	process: {
		1: "Commencez à décrire vos fonctionnalités en langage naturel pour l'IA plutôt que de coder directement",
		2: "Structurez votre approche : découpez en tâches et guidez l'agent avec du contexte préparé",
		3: "Formalisez le cycle complet : Spec → Plan → Implémentation → Validation → Commit",
		4: "Votre process est exemplaire ! Affinez les métriques de cycle et réduisez le lead time",
	},
	docs: {
		1: "Créez au minimum un fichier de configuration agent avec les règles de base de votre projet",
		2: "Structurez votre documentation : ajoutez des patterns, du vocabulaire métier, des anti-patterns",
		3: "Mettez en place l'écosystème complet d'artefacts : PRD, ARCHITECTURE, AGENT-GUIDE, SPECS",
		4: "Documentation exemplaire ! Automatisez la détection de docs obsolètes avec un Agent Documentation",
	},
	quality: {
		1: "Demandez à votre agent IA de générer des tests unitaires pour le code qu'il produit",
		2: "Faites générer les tests par l'agent et exécutez-les systématiquement avant de valider",
		3: "Spécifiez les tests attendus dans vos SPECS et visez >80% de couverture avec revue automatique",
		4: "Qualité au top ! Ajoutez des tests de mutation et un Agent Qualité pour détecter les faiblesses",
	},
	collab: {
		1: "Partagez les bonnes pratiques IA entre développeurs, ne laissez pas chacun seul",
		2: "Commencez à distinguer les rôles : qui prépare le contexte, qui orchestre, qui valide",
		3: "Formalisez les rôles (Product Engineer, QA) et instaurez des rétrospectives IA dédiées",
		4: "Collaboration exemplaire ! Formez d'autres équipes et partagez votre modèle organisationnel",
	},
	vision: {
		1: "Prenez conscience que l'IA est plus qu'un outil de productivité — c'est un changement de paradigme",
		2: "Investissez dans la configuration et le guidage de l'agent plutôt que de juste « générer du code »",
		3: "Adoptez pleinement le paradigme : les devs deviennent des orchestrateurs, l'intention prime sur l'exécution",
		4: "Vision exemplaire ! Évangélisez en interne et contribuez à la communauté AIAD",
	},
};

export function getGlobalRecommendations(level: 1 | 2 | 3 | 4): string[] {
	return GLOBAL_RECOMMENDATIONS[level];
}

export function getDimensionRecommendation(dimensionId: DimensionId, level: 1 | 2 | 3 | 4): string {
	return DIMENSION_RECOMMENDATIONS[dimensionId][level];
}

export function generateRecommendations(score: DiagnosticScore): Recommendation[] {
	const recs: Recommendation[] = [];

	for (const text of getGlobalRecommendations(score.globalLevel)) {
		recs.push({ scope: "global", text });
	}

	for (const [i, dim] of DIMENSIONS.entries()) {
		const raw = score.dimScores[i] ?? 0;
		const level: 1 | 2 | 3 | 4 = raw < 1.75 ? 1 : raw < 2.5 ? 2 : raw < 3.25 ? 3 : 4;
		recs.push({
			scope: "dimension",
			dimensionId: dim.id,
			text: getDimensionRecommendation(dim.id, level),
		});
	}

	return recs;
}
