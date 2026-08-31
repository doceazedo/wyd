import { storage } from "./db";

export type CacheStatus = "HIT" | "MISS" | "BYPASS";

type Request = {
	pathname: string;
	origin: string | null;
	self: string;
	status: number;
	cache: CacheStatus;
	duration: number;
};

type Stats = {
	requests: number;
	hits: number;
	misses: number;
	bypasses: number;
	errors: number;
	rateLimited: number;
	totalDuration: number;
	firstAt: string;
	lastAt: string;
};

const DIRECT = "@direct";

const CACHE_FIELDS = {
	HIT: "hits",
	MISS: "misses",
	BYPASS: "bypasses",
} as const;

const empty = (at: string): Stats => ({
	requests: 0,
	hits: 0,
	misses: 0,
	bypasses: 0,
	errors: 0,
	rateLimited: 0,
	totalDuration: 0,
	firstAt: at,
	lastAt: at,
});

const route = (pathname: string) => {
	const [, service, username, ...rest] = pathname
		.split("/")
		.filter(Boolean)
		.map((segment) => decodeURIComponent(segment));

	return {
		path: pathname,
		service: service || null,
		endpoint: rest.length ? rest.join("/") : "profile",
		username: username || null,
	};
};

const routeKey = (
	prefix: string,
	{ service, endpoint, username }: ReturnType<typeof route>,
) => [prefix, service, endpoint, username].filter(Boolean).join(":");

const host = (value: string | null) => {
	if (!value) return null;

	try {
		const { hostname } = new URL(value);
		const lowercased = hostname.toLowerCase();

		return lowercased.startsWith("www.") ? lowercased.slice(4) : lowercased;
	} catch {
		return null;
	}
};

const bump = async (
	key: string,
	{ status, cache, duration }: Pick<Request, "status" | "cache" | "duration">,
	at: string,
	details: Record<string, unknown> = {},
) => {
	const field = CACHE_FIELDS[cache];
	const stats = (await storage.getItem<Stats>(key)) ?? empty(at);

	await storage.setItem(key, {
		...details,
		...stats,
		requests: stats.requests + 1,
		[field]: stats[field] + 1,
		errors: stats.errors + (status >= 400 ? 1 : 0),
		rateLimited: stats.rateLimited + (status === 429 ? 1 : 0),
		totalDuration: stats.totalDuration + duration,
		lastAt: at,
	});
};

export const record = async ({
	pathname,
	origin,
	self,
	...request
}: Request) => {
	try {
		const at = new Date().toISOString();
		const date = at.slice(0, 10);
		const details = route(pathname);
		const site = host(origin);

		await bump(routeKey("usage:routes", details), request, at, details);
		await bump(`usage:days:${date}`, request, at);
		await bump(`usage:hours:${at.slice(0, 13)}`, request, at);
		await bump(routeKey(`usage:daily:routes:${date}`, details), request, at, {
			...details,
			date,
		});

		if (site !== host(self))
			await bump(`usage:daily:origins:${date}:${site ?? DIRECT}`, request, at, {
				host: site,
				date,
			});
	} catch (err) {
		console.error("could not record usage", err);
	}
};
