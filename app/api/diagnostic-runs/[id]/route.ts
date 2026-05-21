import { createClient } from "@/lib/supabase/server";
/**
 * @spec SPEC-001-3-api-diagnostic
 * @intent INTENT-001-diagnostic-equipe
 * @verified-by tests/integration/api/diagnostic.test.ts
 * @governance AIAD-RGPD
 */
import { z } from "zod";

const draftSchema = z.object({
	answers: z.record(z.union([z.string(), z.number(), z.array(z.string())])),
	current_step: z.number().int().min(0),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	const supabase = createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return Response.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401 });
	}

	const body = draftSchema.safeParse(await req.json());
	if (!body.success) {
		return Response.json(
			{ error: { code: "VALIDATION_ERROR", details: body.error.flatten() } },
			{ status: 400 },
		);
	}

	const { data, error } = await supabase
		.from("diagnostic_runs")
		.update({
			answers: body.data.answers,
			current_step: body.data.current_step,
			updated_at: new Date().toISOString(),
		})
		.eq("id", params.id)
		.select("id, status")
		.single();

	if (error || !data) {
		return Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
	}

	return Response.json({ id: data.id, status: data.status });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
	const supabase = createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return Response.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401 });
	}

	const { data, error } = await supabase
		.from("diagnostic_runs")
		.select(
			"id, campaign_id, team_id, answers, score, recommendations, status, current_step, created_at, updated_at",
		)
		.eq("id", params.id)
		.single();

	if (error || !data) {
		return Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
	}

	return Response.json(data);
}
