/**
 * @spec SPEC-001-2-scoring-engine
 * @intent INTENT-001-diagnostic-equipe
 * @governance AIAD-RGESN
 */

export type DiagnosticAnswers = Record<number, 1 | 2 | 3 | 4>;

export type DiagnosticScore = {
	globalScore: number;
	globalLevel: 1 | 2 | 3 | 4;
	dimScores: number[];
};

export type DimensionId = "tools" | "process" | "docs" | "quality" | "collab" | "vision";

export type Dimension = {
	id: DimensionId;
	label: string;
	short: string;
};

export type Question = {
	index: number;
	dimension: number;
	text: string;
	options: [string, string, string, string];
};

export type Recommendation = {
	scope: "global" | "dimension";
	dimensionId?: DimensionId;
	text: string;
};
