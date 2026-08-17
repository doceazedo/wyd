import { json, type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { getTextDirection } from "$lib/paraglide/runtime";
import { paraglideMiddleware } from "$lib/paraglide/server";
import { cacheControl, read, write } from "$lib/server/cache";
import { consume, retryAfter } from "$lib/server/rate-limit";
import { record, type CacheStatus } from "$lib/server/usage";

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "*",
	"Access-Control-Max-Age": "86400",
};

const handleCors: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith("/api/")) return resolve(event);

	if (event.request.method === "OPTIONS")
		return new Response(null, { status: 204, headers: CORS_HEADERS });

	const response = await resolve(event);
	Object.entries(CORS_HEADERS).forEach(([key, value]) =>
		response.headers.set(key, value),
	);

	return response;
};

const handleUsage: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith("/api/")) return resolve(event);

	const startedAt = Date.now();
	const response = await resolve(event);

	await record({
		pathname: event.url.pathname,
		status: response.status,
		cache: (response.headers.get("X-Cache") as CacheStatus) || "BYPASS",
		duration: Date.now() - startedAt,
	});

	return response;
};

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

const handleRateLimit: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith("/api/")) return resolve(event);

	const counter = await consume(event.getClientAddress());
	if (counter?.exceeded)
		return json(
			{ message: "too many requests, try again later" },
			{
				status: 429,
				headers: {
					"Cache-Control": "no-store",
					"Retry-After": retryAfter(counter.resetAt),
				},
			},
		);

	return resolve(event);
};

export const handle: Handle = sequence(
	handleCors,
	handleUsage,
	handleCache,
	handleRateLimit,
	handleParaglide,
);
