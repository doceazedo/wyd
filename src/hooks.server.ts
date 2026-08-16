import { json, type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { getTextDirection } from "$lib/paraglide/runtime";
import { paraglideMiddleware } from "$lib/paraglide/server";
import { cacheControl, read, write } from "$lib/server/cache";

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace("%paraglide.lang%", locale)
					.replace("%paraglide.dir%", getTextDirection(locale)),
		});
	});

const handleCache: Handle = async ({ event, resolve }) => {
	const key = event.url.pathname;
	if (event.request.method !== "GET" || !key.startsWith("/api/"))
		return resolve(event);

	const cached = await read(key);
	if (cached)
		return json(cached.value, {
			headers: {
				"Cache-Control": cacheControl(cached.expiresAt),
				"X-Cache": "HIT",
			},
		});

	const response = await resolve(event);
	const type = response.headers.get("Content-Type") || "";
	if (response.status !== 200 || !type.startsWith("application/json"))
		return response;

	const body = {
		...(await response.json()),
		updatedAt: new Date().toISOString(),
	};
	const expiresAt = await write(key, body);

	return json(body, {
		headers: {
			"Cache-Control": cacheControl(expiresAt),
			"X-Cache": "MISS",
		},
	});
};

export const handle: Handle = sequence(handleCache, handleParaglide);
