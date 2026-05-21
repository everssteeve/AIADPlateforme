import { computeScore } from "@/lib/scoring/engine";
import { generateRecommendations } from "@/lib/scoring/recommendations";
import type { DiagnosticAnswers } from "@/lib/scoring/types";
import { createClient } from "@/lib/supabase/server";
/**
 * @spec SPEC-001-3-api-diagnostic
 * @intent INTENT-001-diagnostic-equipe
 * @verified-by tests/integration/api/diagnostic.test.ts
 * @governance AIAD-RGPD
 */
import { z } from "zod";

const submitSchema = z.object({
	team_id: z.string().uuid(),
	answers: z.record(z.union([z.string(), z.number(), z.array(z.string())])),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
	const supabase = createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return Response.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401 });
	}

	const body = submitSchema.safeParse(await req.json());
	if (!body.success) {
		return Response.json(
			{ error: { code: "VALIDATION_ERROR", details: body.error.flatten() } },
			{ status: 400 },
		);
	}

	// Resolve user's organization
	const { data: profile } = await supabase
		.from("user_profiles")
		.select("organization_id")
		.eq("id", user.id)
		.single();

	if (!profile) {
		return Response.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401 });
	}

	// Verify campaign belongs to user's org (explicit check + RLS belt-and-suspenders)
	const { data: campaign } = await supabase
		.from("campaigns")
		.select("id, organization_id")
		.eq("id", params.id)
		.single();

	if (!campaign || campaign.organization_id !== profile.organization_id) {
		return Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
	}

	// Idempotence: reject if already scored
	const { data: existingRun } = await supabase
		.from("diagnostic_runs")
		.select("id")
		.eq("campaign_id", params.id)
		.eq("team_id", body.data.team_id)
		.eq("status", "scored")
		.maybeSingle();

	if (existingRun) {
		return Response.json({ error: { code: "ALREADY_SUBMITTED" } }, { status: 409 });
	}

	// Compute score synchronously
	const rawAnswers = Object.fromEntries(
		Object.entries(body.data.answers).map(([k, v]) => [Number(k), Number(v)]),
	) as DiagnosticAnswers;

	let score: ReturnType<typeof computeScore>;
	let recommendations: ReturnType<typeof generateRecommendations>;
	try {
		score = computeScore(rawAnswers);
		recommendations = generateRecommendations(score);
	} catch {
		return Response.json(
			{
				error: {
					code: "VALIDATION_ERROR",
					details: { formErrors: ["Invalid answers format"] },
				},
			},
			{ status: 400 },
		);
	}

	// Persist scored run
	const { data: run, error: insertError } = await supabase
		.from("diagnostic_runs")
		.insert({
			campaign_id: params.id,
			team_id: body.data.team_id,
			organization_id: profile.organization_id,
			answers: body.data.answers,
			score,
			recommendations,
			status: "scored",
		})
		.select("id, score, recommendations, status")
		.single();

	if (insertError || !run) {
		return Response.json({ error: { code: "INTERNAL_ERROR" } }, { status: 500 });
	}

	return Response.json(
		{
			id: run.id,
			score: run.score,
			recommendations: run.recommendations,
			status: run.status,
		},
		{ status: 201 },
	);
}
