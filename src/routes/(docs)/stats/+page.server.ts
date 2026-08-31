import { error, fail } from "@sveltejs/kit";
import { COOKIE, enabled, matches, MAX_AGE } from "$lib/server/auth";
import { stats } from "$lib/server/stats";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ cookies }) => {
	if (!enabled()) error(404);
	if (!matches(cookies.get(COOKIE))) return { stats: null };

	return { stats: await stats() };
};

export const actions: Actions = {
	default: async ({ cookies, request }) => {
		if (!enabled()) error(404);

		const secret = (await request.formData()).get("secret");
		if (typeof secret !== "string" || !matches(secret))
			return fail(401, { invalid: true });

		cookies.set(COOKIE, secret, {
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			maxAge: MAX_AGE,
		});

		return { success: true };
	},
};
