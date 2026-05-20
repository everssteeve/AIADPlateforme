/**
 * @spec SPEC-001-2-scoring-engine
 * @intent INTENT-001-diagnostic-equipe
 *
 * Couvre : CA-001, CA-002, CA-003, CA-004, CA-005a/b/c/d, CA-008, CA-009
 */
import { describe, expect, it } from "vitest";
import { computeScore } from "../../../lib/scoring/engine";
import type { DiagnosticAnswers } from "../../../lib/scoring/types";

function allAnswers(value: 1 | 2 | 3 | 4): DiagnosticAnswers {
	const answers: DiagnosticAnswers = {} as DiagnosticAnswers;
	for (let i = 0; i < 14; i++) answers[i] = value;
	return answers;
}

describe("computeScore", () => {
	// CA-001 — globalScore dans [1.0–4.0]
	it("score-global-range: globalScore is in [1.0, 4.0] for any valid input", () => {
		for (const v of [1, 2, 3, 4] as const) {
			const { globalScore } = computeScore(allAnswers(v));
			expect(globalScore).toBeGreaterThanOrEqual(1.0);
			expect(globalScore).toBeLessThanOrEqual(4.0);
		}
	});

	// CA-002 — chaque dimScore dans [1.0–4.0]
	it("score-dimensions-range: each dimScore is in [1.0, 4.0]", () => {
		for (const v of [1, 2, 3, 4] as const) {
			const { dimScores } = computeScore(allAnswers(v));
			for (const s of dimScores) {
				expect(s).toBeGreaterThanOrEqual(1.0);
				expect(s).toBeLessThanOrEqual(4.0);
			}
		}
	});

	// CA-003 — dimScores a exactement 6 éléments
	it("score-dimensions-count: dimScores has exactly 6 elements", () => {
		const { dimScores } = computeScore(allAnswers(2));
		expect(dimScores).toHaveLength(6);
	});

	// CA-004 — déterminisme
	it("determinism: identical input produces identical output", () => {
		const answers = allAnswers(3);
		const first = computeScore(answers);
		const second = computeScore(answers);
		expect(first).toEqual(second);
	});

	// CA-005a — niveau 1 si globalScore < 1.75
	it("level-threshold-1: all answers=1 → globalLevel=1 (globalScore=1.0 < 1.75)", () => {
		const { globalScore, globalLevel } = computeScore(allAnswers(1));
		expect(globalScore).toBe(1.0);
		expect(globalLevel).toBe(1);
	});

	// CA-005b — niveau 2 si 1.75 ≤ globalScore < 2.50
	it("level-threshold-2: all answers=2 → globalLevel=2 (globalScore=2.0)", () => {
		const { globalScore, globalLevel } = computeScore(allAnswers(2));
		expect(globalScore).toBe(2.0);
		expect(globalLevel).toBe(2);
	});

	// CA-005c — niveau 3 si 2.50 ≤ globalScore < 3.25
	it("level-threshold-3: all answers=3 → globalLevel=3 (globalScore=3.0)", () => {
		const { globalScore, globalLevel } = computeScore(allAnswers(3));
		expect(globalScore).toBe(3.0);
		expect(globalLevel).toBe(3);
	});

	// CA-005d — niveau 4 si globalScore ≥ 3.25
	it("level-threshold-4: all answers=4 → globalLevel=4 (globalScore=4.0)", () => {
		const { globalScore, globalLevel } = computeScore(allAnswers(4));
		expect(globalScore).toBe(4.0);
		expect(globalLevel).toBe(4);
	});

	// CA-008 — TypeError si réponses manquantes
	it("missing-answers-rejection: throws TypeError with MISSING_REQUIRED_ANSWERS", () => {
		const incomplete = { 0: 2, 1: 2 } as unknown as DiagnosticAnswers;

		let caught: unknown;
		try {
			computeScore(incomplete);
		} catch (e) {
			caught = e;
		}

		expect(caught).toBeInstanceOf(TypeError);
		const err = caught as TypeError & { code: string; missingKeys: number[] };
		expect(err.code).toBe("MISSING_REQUIRED_ANSWERS");
		expect(err.missingKeys).toContain(2);
		expect(err.missingKeys).toContain(13);
	});

	// CA-009 — RangeError si valeur hors {1,2,3,4}
	it("out-of-range-rejection: throws RangeError for value outside {1,2,3,4}", () => {
		const invalid = { ...allAnswers(2), 5: 0 } as unknown as DiagnosticAnswers;

		let caught: unknown;
		try {
			computeScore(invalid);
		} catch (e) {
			caught = e;
		}

		expect(caught).toBeInstanceOf(RangeError);
		const msg = (caught as RangeError).message;
		expect(msg).toContain("5");
		expect(msg).toContain("0");
	});
});
