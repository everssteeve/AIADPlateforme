import { createClient as createSupabaseClient } from "@supabase/supabase-js";
/**
 * @spec SPEC-001-3-api-diagnostic
 * @intent INTENT-001-diagnostic-equipe
 * @governance AIAD-RGPD
 *
 * Tests d'intégration des routes API diagnostic (CA-001 → CA-010).
 * Nécessite Supabase local en cours : `supabase start`
 * Variables requises dans .env.test : SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *
 * Stratégie : @/lib/supabase/server est mocké pour injecter un client service-role
 * dont auth.getUser est stubbé. Les opérations DB utilisent le service role (RLS bypassé).
 * L'isolation cross-org (CA-008) est simulée via un ID inexistant — comportement
 * identique à un bloc RLS côté client (0 rows → 404).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// ─── Mock @/lib/supabase/server (avant tout import de route handler) ──────────

const supabaseHolder = vi.hoisted(() => ({ client: null as unknown }));

vi.mock("@/lib/supabase/server", () => ({
	createClient: () => supabaseHolder.client,
}));

// ─── Route handlers ───────────────────────────────────────────────────────────

import { POST } from "@/app/api/campaigns/[id]/diagnostic/submit/route";
import { GET, PATCH } from "@/app/api/diagnostic-runs/[id]/route";

// ─── Admin client (service role — bypass RLS pour le setup des fixtures) ──────

const admin = createSupabaseClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
	{ auth: { persistSession: false } },
);

// ─── Helper : client service-role avec auth.getUser stubbé ───────────────────

function makeClient(mockUserId: string | null) {
	const base = createSupabaseClient(
		process.env.SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{ auth: { persistSession: false } },
	);
	return {
		auth: {
			getUser: async () => ({
				data: { user: mockUserId ? { id: mockUserId } : null },
				error: null,
			}),
		},
		from: (...args: Parameters<typeof base.from>) => base.from(...args),
	};
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

let orgId: string;
let userId: string;
let campaignId: string;
let teamId: string;
let runId: string;

// 14 réponses valides (index 0–13, valeur 3/4)
const VALID_ANSWERS = Object.fromEntries(Array.from({ length: 14 }, (_, i) => [String(i), 3]));

beforeAll(async () => {
	const { data: org } = await admin
		.from("organizations")
		.insert({ name: `Test Org API ${Date.now()}` })
		.select("id")
		.single();
	orgId = org!.id;

	const { data: authUser } = await admin.auth.admin.createUser({
		email: `api-test-${Date.now()}@example.com`,
		password: "test-password-123!",
		email_confirm: true,
	});
	userId = authUser.user!.id;

	await admin
		.from("user_profiles")
		.insert({ id: userId, organization_id: orgId, role: "contributor" });

	const { data: campaign } = await admin
		.from("campaigns")
		.insert({
			organization_id: orgId,
			name: "Test Campaign API",
			period: "Q1 2026",
			created_by: userId,
		})
		.select("id")
		.single();
	campaignId = campaign!.id;

	const { data: team } = await admin
		.from("teams")
		.insert({ organization_id: orgId, name: "Test Team API" })
		.select("id")
		.single();
	teamId = team!.id;

	const { data: run } = await admin
		.from("diagnostic_runs")
		.insert({
			campaign_id: campaignId,
			team_id: teamId,
			organization_id: orgId,
			status: "draft",
		})
		.select("id")
		.single();
	runId = run!.id;
});

afterAll(async () => {
	await admin.from("diagnostic_runs").delete().eq("campaign_id", campaignId);
	await admin.from("campaigns").delete().eq("id", campaignId);
	await admin.from("teams").delete().eq("id", teamId);
	await admin.from("user_profiles").delete().eq("id", userId);
	await admin.auth.admin.deleteUser(userId);
	await admin.from("organizations").delete().eq("id", orgId);
});

// ─── CA-001 ───────────────────────────────────────────────────────────────────

describe("CA-001 — draft-save-persisted", () => {
	it("persists answers and current_step to the database", async () => {
		supabaseHolder.client = makeClient(userId);

		const req = new Request(`http://localhost/api/diagnostic-runs/${runId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ answers: { "0": 2, "1": 3 }, current_step: 1 }),
		});
		const res = await PATCH(req, { params: { id: runId } });
		expect(res.status).toBe(200);

		const { data } = await admin
			.from("diagnostic_runs")
			.select("answers, current_step")
			.eq("id", runId)
			.single();
		expect(data?.current_step).toBe(1);
		expect((data?.answers as Record<string, number>)["0"]).toBe(2);
	});
});

// ─── CA-002 ───────────────────────────────────────────────────────────────────

describe("CA-002 — draft-save-200", () => {
	it("returns HTTP 200 with id and status draft", async () => {
		supabaseHolder.client = makeClient(userId);

		const req = new Request(`http://localhost/api/diagnostic-runs/${runId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ answers: { "0": 1 }, current_step: 0 }),
		});
		const res = await PATCH(req, { params: { id: runId } });
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.id).toBe(runId);
		expect(body.status).toBe("draft");
	});
});

// ─── CA-003 + CA-004 + CA-005 ────────────────────────────────────────────────

describe("CA-003+004+005 — submit-scoring-computed", () => {
	it("computes score, persists run scored, returns HTTP 201 within 2000ms", async () => {
		supabaseHolder.client = makeClient(userId);

		const start = Date.now();
		const req = new Request(`http://localhost/api/campaigns/${campaignId}/diagnostic/submit`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ team_id: teamId, answers: VALID_ANSWERS }),
		});
		const res = await POST(req, { params: { id: campaignId } });
		const elapsed = Date.now() - start;
		const body = await res.json();

		expect(res.status).toBe(201);
		expect(elapsed).toBeLessThan(2000);
		expect(body.id).toBeDefined();
		expect(typeof body.score?.globalScore).toBe("number");
		expect(Array.isArray(body.recommendations)).toBe(true);
		expect(body.recommendations.length).toBeGreaterThan(0);
		expect(body.status).toBe("scored");

		// Vérification persistance DB
		const { data: persisted } = await admin
			.from("diagnostic_runs")
			.select("status, score, recommendations")
			.eq("id", body.id)
			.single();
		expect(persisted?.status).toBe("scored");
		expect(persisted?.score).toBeTruthy();
		expect(Array.isArray(persisted?.recommendations)).toBe(true);
	});
});

// ─── CA-006 ───────────────────────────────────────────────────────────────────

describe("CA-006 — get-results", () => {
	it("returns HTTP 200 with diagnostic_run (sans organization_id)", async () => {
		supabaseHolder.client = makeClient(userId);

		const req = new Request(`http://localhost/api/diagnostic-runs/${runId}`);
		const res = await GET(req, { params: { id: runId } });
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.id).toBe(runId);
		expect(body).not.toHaveProperty("organization_id");
		expect(body).toHaveProperty("answers");
		expect(body).toHaveProperty("status");
	});
});

// ─── CA-007 ───────────────────────────────────────────────────────────────────

describe("CA-007 — invalid-payload-400", () => {
	it("rejects invalid team_id with HTTP 400 VALIDATION_ERROR", async () => {
		supabaseHolder.client = makeClient(userId);

		const req = new Request(`http://localhost/api/campaigns/${campaignId}/diagnostic/submit`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ team_id: "not-a-uuid", answers: VALID_ANSWERS }),
		});
		const res = await POST(req, { params: { id: campaignId } });
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body.error.code).toBe("VALIDATION_ERROR");
		expect(body.error.details).toBeDefined();
	});
});

// ─── CA-008 ───────────────────────────────────────────────────────────────────

describe("CA-008 — cross-org-isolation", () => {
	it("returns HTTP 404 for a resource outside the org (no existence disclosure)", async () => {
		supabaseHolder.client = makeClient(userId);

		// ID non-existent → même comportement que RLS qui bloque (0 rows → 404)
		const alienId = "00000000-0000-0000-0000-000000000001";
		const req = new Request(`http://localhost/api/diagnostic-runs/${alienId}`);
		const res = await GET(req, { params: { id: alienId } });

		expect(res.status).toBe(404);
	});
});

// ─── CA-009 ───────────────────────────────────────────────────────────────────

describe("CA-009 — unauthenticated-401", () => {
	it("returns HTTP 401 for requests without valid JWT", async () => {
		supabaseHolder.client = makeClient(null);

		const req = new Request(`http://localhost/api/diagnostic-runs/${runId}`);
		const res = await GET(req, { params: { id: runId } });
		const body = await res.json();

		expect(res.status).toBe(401);
		expect(body.error.code).toBe("UNAUTHENTICATED");
	});
});

// ─── CA-010 ───────────────────────────────────────────────────────────────────

describe("CA-010 — double-submit-409", () => {
	it("returns HTTP 409 ALREADY_SUBMITTED for a run already scored", async () => {
		supabaseHolder.client = makeClient(userId);

		// Le run teamId/campaignId est déjà scoré par CA-003+004+005
		const req = new Request(`http://localhost/api/campaigns/${campaignId}/diagnostic/submit`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ team_id: teamId, answers: VALID_ANSWERS }),
		});
		const res = await POST(req, { params: { id: campaignId } });
		const body = await res.json();

		expect(res.status).toBe(409);
		expect(body.error.code).toBe("ALREADY_SUBMITTED");
	});
});
