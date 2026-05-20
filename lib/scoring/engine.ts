import { DIMENSIONS, QUESTIONS, QUESTION_COUNT } from "./questions";
/**
 * @spec SPEC-001-2-scoring-engine
 * @intent INTENT-001-diagnostic-equipe
 * @verified-by tests/unit/scoring/engine.test.ts
 * @governance AIAD-RGESN
 */
import type { DiagnosticAnswers, DiagnosticScore } from "./types";

export function computeScore(answers: DiagnosticAnswers): DiagnosticScore {
	const missingKeys: number[] = [];
	for (let i = 0; i < QUESTION_COUNT; i++) {
		if (!(i in answers)) missingKeys.push(i);
	}
	if (missingKeys.length > 0) {
		const err = new TypeError(
			`MISSING_REQUIRED_ANSWERS: missing question indices [${missingKeys.join(", ")}]`,
		);
		Object.assign(err, { code: "MISSING_REQUIRED_ANSWERS", missingKeys });
		throw err;
	}

	for (let i = 0; i < QUESTION_COUNT; i++) {
		const val = answers[i];
		if (val !== 1 && val !== 2 && val !== 3 && val !== 4) {
			throw new RangeError(
				`Question ${i} has invalid value: ${val} (expected 1, 2, 3 or 4)`,
			);
		}
	}

	const dimTotals = new Array<number>(DIMENSIONS.length).fill(0);
	const dimCounts = new Array<number>(DIMENSIONS.length).fill(0);
	for (const q of QUESTIONS) {
		dimTotals[q.dimension] += answers[q.index];
		dimCounts[q.dimension] += 1;
	}

	const dimScores = DIMENSIONS.map((_, i) => dimTotals[i] / dimCounts[i]);
	const globalScore = dimScores.reduce((a, b) => a + b, 0) / dimScores.length;

	const globalLevel: 1 | 2 | 3 | 4 =
		globalScore < 1.75 ? 1 : globalScore < 2.5 ? 2 : globalScore < 3.25 ? 3 : 4;

	return { globalScore, globalLevel, dimScores };
}
