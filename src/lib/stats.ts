import { getLocale } from "$lib/paraglide/runtime";

const FIELDS = [
	"requests",
	"hits",
	"misses",
	"bypasses",
	"errors",
	"rateLimited",
	"totalDuration",
] as const;

export const PERIODS = [
	{ key: "today", days: 1 },
	{ key: "weeks", days: 49 },
	{ key: "month", days: 30 },
	{ key: "year", days: 365 },
] as const;

export const DEFAULT_PERIOD = "weeks";

export type PeriodKey = (typeof PERIODS)[number]["key"];

export type Totals = Record<(typeof FIELDS)[number], number>;

export type SeriesPoint = Totals & { at: string };

export type ServiceStats = Totals & { service: string };

export type EndpointStats = Totals & {
	service: string;
	endpoint: string;
	users: number;
	lastAt: string | null;
};

export type OriginStats = Totals & {
	host: string | null;
	lastAt: string | null;
};

export type PeriodStats = {
	profiles: number;
	services: ServiceStats[];
	endpoints: EndpointStats[];
	origins: OriginStats[];
};

export type Stats = {
	totals: Totals;
	days: SeriesPoint[];
	hours: SeriesPoint[];
	periods: Record<PeriodKey, PeriodStats>;
};

export const empty = () =>
	Object.fromEntries(FIELDS.map((field) => [field, 0])) as Totals;

export const add = (totals: Totals, entry: Partial<Totals>) =>
	Object.fromEntries(
		FIELDS.map((field) => [field, totals[field] + (entry[field] ?? 0)]),
	) as Totals;

export const sum = (entries: Partial<Totals>[]) => entries.reduce(add, empty());

export const period = (key: string) =>
	PERIODS.find((option) => option.key === key) ??
	PERIODS.find((option) => option.key === DEFAULT_PERIOD)!;

export const fresh = (totals: Totals) =>
	Math.max(0, totals.misses + totals.bypasses - totals.errors);

export const count = (value: number) =>
	new Intl.NumberFormat(getLocale()).format(value);

export const share = (value: number, total: number) =>
	new Intl.NumberFormat(getLocale(), {
		style: "percent",
		maximumFractionDigits: 1,
	}).format(total ? value / total : 0);

export const average = (total: number, requests: number) =>
	requests ? total / requests : 0;

export const duration = (value: number) => {
	const format = (amount: number, digits: number) =>
		new Intl.NumberFormat(getLocale(), {
			maximumFractionDigits: digits,
		}).format(amount);

	return value < 1000
		? `${format(Math.round(value), 0)}ms`
		: `${format(value / 1000, 1)}s`;
};

export const hourTime = (value: Date | string) =>
	new Date(value).toLocaleTimeString(getLocale(), {
		hour: "2-digit",
		minute: "2-digit",
		timeZone: "UTC",
	});

export const shortDate = (value: Date | string) =>
	new Date(value).toLocaleDateString(getLocale(), {
		day: "numeric",
		month: "short",
		timeZone: "UTC",
	});

export const dateTime = (value: Date | string) =>
	new Date(value).toLocaleString(getLocale(), {
		dateStyle: "short",
		timeStyle: "short",
		timeZone: "UTC",
	});
