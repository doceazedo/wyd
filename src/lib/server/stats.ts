import {
	add,
	empty,
	PERIODS,
	sum,
	type PeriodKey,
	type PeriodStats,
	type Stats,
} from "$lib/stats";
import { storage } from "./db";

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const POINTS = 24;
const TTL = 60 * 1000;

const ROUTES_PREFIX = "usage:routes:";
const DAYS_PREFIX = "usage:days:";
const HOURS_PREFIX = "usage:hours:";
const DAILY_ROUTES_PREFIX = "usage:daily:routes:";
const DAILY_ORIGINS_PREFIX = "usage:daily:origins:";
const DIRECT = "@direct";

type Entry = Partial<Stats["totals"]> & {
	firstAt?: string;
	lastAt?: string;
	date?: string;
	service?: string | null;
	endpoint?: string | null;
	username?: string | null;
	host?: string | null;
};

const groupBy = (entries: Entry[], keyOf: (entry: Entry) => string) => {
	const groups = new Map<string, Entry[]>();

	entries.forEach((entry) => {
		const key = keyOf(entry);
		const current = groups.get(key);

		if (current) current.push(entry);
		else groups.set(key, [entry]);
	});

	return [...groups.values()];
};

const day = (offset = 0) =>
	new Date(Date.now() + offset * DAY).toISOString().slice(0, 10);

const hour = (offset = 0) =>
	new Date(Date.now() + offset * HOUR).toISOString().slice(0, 13);

const dates = (from: string, to: string) => {
	const start = Date.parse(`${from}T00:00:00.000Z`);
	const end = Date.parse(`${to}T00:00:00.000Z`);
	const length = Math.max(0, Math.round((end - start) / DAY)) + 1;

	return Array.from({ length }, (_, index) =>
		new Date(start + index * DAY).toISOString().slice(0, 10),
	);
};

const hours = () =>
	Array.from({ length: POINTS }, (_, index) => hour(index + 1 - POINTS));

const sorted = (values: (string | undefined)[]) =>
	values.flatMap((value) => value ?? []).sort();

const longest = () =>
	PERIODS.reduce((max, option) => Math.max(max, option.days), 0);

const dateOf = (key: string, prefix: string) =>
	key.slice(prefix.length, prefix.length + 10);

const read = async () => {
	const keys = await storage.getKeys("usage");
	const oldest = day(1 - longest());
	const since = hour(1 - POINTS);

	const wanted = keys.filter((key) => {
		if (key.startsWith(DAILY_ROUTES_PREFIX))
			return dateOf(key, DAILY_ROUTES_PREFIX) >= oldest;
		if (key.startsWith(DAILY_ORIGINS_PREFIX))
			return dateOf(key, DAILY_ORIGINS_PREFIX) >= oldest;
		if (key.startsWith(HOURS_PREFIX))
			return key.slice(HOURS_PREFIX.length) >= since;

		return true;
	});

	const items = await Promise.all(
		wanted.map(async (key) => ({
			key,
			entry: await storage.getItem<Entry>(key),
		})),
	);

	return items.flatMap(({ key, entry }) => (entry ? [{ key, entry }] : []));
};

const series = (
	points: string[],
	recorded: Map<string, Entry>,
	suffix: string,
) =>
	points.map((point) => ({
		at: `${point}${suffix}`,
		...add(empty(), recorded.get(point) ?? {}),
	}));

const aggregate = (
	routes: Entry[],
	origins: Entry[],
	profiles: number,
): PeriodStats => ({
	profiles,
	services: groupBy(routes, (entry) => entry.service ?? "unknown")
		.map((entries) => ({
			service: entries[0].service ?? "unknown",
			...sum(entries),
		}))
		.sort((a, b) => b.requests - a.requests),
	endpoints: groupBy(routes, (entry) => `${entry.service}/${entry.endpoint}`)
		.map((entries) => ({
			service: entries[0].service ?? "unknown",
			endpoint: entries[0].endpoint ?? "profile",
			users: new Set(entries.flatMap((entry) => entry.username ?? [])).size,
			lastAt: sorted(entries.map((entry) => entry.lastAt)).at(-1) ?? null,
			...sum(entries),
		}))
		.sort((a, b) => b.requests - a.requests),
	origins: groupBy(origins, (entry) => entry.host ?? DIRECT)
		.map((entries) => ({
			host: entries[0].host ?? null,
			lastAt: sorted(entries.map((entry) => entry.lastAt)).at(-1) ?? null,
			...sum(entries),
		}))
		.sort((a, b) => b.requests - a.requests),
});

const collect = async (): Promise<Stats> => {
	const items = await read();
	const pick = (prefix: string) =>
		items.filter(({ key }) => key.startsWith(prefix)).map(({ entry }) => entry);

	const lifetime = pick(ROUTES_PREFIX);
	const dailyRoutes = pick(DAILY_ROUTES_PREFIX);
	const dailyOrigins = pick(DAILY_ORIGINS_PREFIX);

	const recordedDays = new Map(
		items
			.filter(({ key }) => key.startsWith(DAYS_PREFIX))
			.map(({ key, entry }) => [key.slice(DAYS_PREFIX.length), entry]),
	);
	const recordedHours = new Map(
		items
			.filter(({ key }) => key.startsWith(HOURS_PREFIX))
			.map(({ key, entry }) => [key.slice(HOURS_PREFIX.length), entry]),
	);

	const first = [...recordedDays.keys()].sort().at(0);
	const days = first
		? series(dates(first, day()), recordedDays, "T00:00:00.000Z")
		: [];

	const periods = Object.fromEntries(
		PERIODS.map((option) => {
			const window = new Set(
				option.days === 1 ? [day()] : dates(day(1 - option.days), day()),
			);
			const since =
				option.days === 1
					? new Date(Date.now() - POINTS * HOUR).toISOString()
					: `${day(1 - option.days)}T00:00:00.000Z`;
			const inWindow = (entry: Entry) =>
				Boolean(entry.date && window.has(entry.date));
			const profiles = new Set(
				lifetime
					.filter((entry) => entry.lastAt && entry.lastAt >= since)
					.flatMap((entry) => entry.username ?? []),
			).size;

			return [
				option.key,
				aggregate(
					dailyRoutes.filter(inWindow),
					dailyOrigins.filter(inWindow),
					profiles,
				),
			];
		}),
	) as Record<PeriodKey, PeriodStats>;

	return {
		totals: sum(lifetime),
		days,
		hours: series(hours(), recordedHours, ":00:00.000Z"),
		periods,
	};
};

let cached: { at: number; value: Stats } | null = null;

export const stats = async () => {
	if (cached && Date.now() - cached.at < TTL) return cached.value;

	const value = await collect();
	cached = { at: Date.now(), value };

	return value;
};
