/**
 * @spec SPEC-001-3-api-diagnostic
 * @intent INTENT-001-diagnostic-equipe
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
	const cookieStore = cookies();

	const supabaseUrl = process.env.SUPABASE_URL ?? "";
	const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";

	return createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(cookiesToSet) {
				try {
					for (const { name, value, options } of cookiesToSet) {
						cookieStore.set(name, value, options);
					}
				} catch {
					// Called from a Server Component — cookie store is read-only
				}
			},
		},
	});
}
