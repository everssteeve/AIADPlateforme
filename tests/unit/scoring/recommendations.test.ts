/**
 * @spec SPEC-001-2-scoring-engine
 * @intent INTENT-001-diagnostic-equipe
 *
 * Couvre : CA-006, CA-007, CA-010
 */
import { describe, expect, it } from "vitest";
import {
	getDimensionRecommendation,
	getGlobalRecommendations,
} from "../../../lib/scoring/recommendations";
import type { DimensionId } from "../../../lib/scoring/types";

const LEVELS = [1, 2, 3, 4] as const;
const DIMENSION_IDS: DimensionId[] = [
	"tools",
	"process",
	"docs",
	"quality",
	"collab",
	"vision",
];

// Strings explicitly forbidden by CA-010 in level-4 global recommendations
const FORBIDDEN_LEVEL4 = [
	"pour passer au niveau",
	"progresser vers Niv.",
	"pour atteindre le niveau",
];

describe("getGlobalRecommendations", () => {
	// CA-006 — tableau non vide pour chaque niveau
	it("global-recs-all-levels: returns a non-empty array for every level in {1,2,3,4}", () => {
		for (const level of LEVELS) {
			const recs = getGlobalRecommendations(level);
			expect(Array.isArray(recs)).toBe(true);
			expect(recs.length).toBeGreaterThan(0);
		}
	});

	// CA-010 — level 4 sans invitation à progresser
	it("level4-no-next-level: level-4 recommendations contain none of the forbidden substrings", () => {
		const recs = getGlobalRecommendations(4);
		for (const rec of recs) {
			for (const forbidden of FORBIDDEN_LEVEL4) {
				expect(rec.toLowerCase()).not.toContain(forbidden.toLowerCase());
			}
		}
	});
});

describe("getDimensionRecommendation", () => {
	// CA-007 — chaîne non vide pour toute combinaison dimension × niveau
	it("dim-recs-all-combinations: returns a non-empty string for every dimensionId × level", () => {
		for (const dim of DIMENSION_IDS) {
			for (const level of LEVELS) {
				const rec = getDimensionRecommendation(dim, level);
				expect(typeof rec).toBe("string");
				expect(rec.length).toBeGreaterThan(0);
			}
		}
	});
});
