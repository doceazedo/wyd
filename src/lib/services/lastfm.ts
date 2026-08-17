import { env } from "$env/dynamic/private";

export const BASE_URL = "https://ws.audioscrobbler.com/2.0/";
export const PROFILE_URL = "https://www.last.fm/user";

const ARTWORK_PLACEHOLDER = "2a96cbd8b46e442fc41c2b86b821562f";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const STATUS: Record<number, number> = {
	6: 404,
	8: 502,
	10: 500,
	26: 500,
	29: 429,
};

export const PERIODS = {
	"7d": "7day",
	"30d": "1month",
	"90d": "3month",
	"180d": "6month",
	"365d": "12month",
	all: "overall",
} as const;

export const DEFAULT_PERIOD = "7d";

export type Period = keyof typeof PERIODS;

export type Image = { "#text"?: string; size?: string };

export type RawTrack = {
	name?: string;
	url?: string;
	playcount?: string;
	image?: Image[];
	artist?: { name?: string; "#text"?: string };
	album?: { "#text"?: string };
	date?: { uts?: string };
	"@attr"?: { nowplaying?: string; rank?: string };
};

export type RawArtist = {
	name?: string;
	url?: string;
	playcount?: string;
	image?: Image[];
	"@attr"?: { rank?: string };
};

export type RawAlbum = {
	name?: string;
	url?: string;
	playcount?: string;
	image?: Image[];
	artist?: { name?: string; "#text"?: string };
	"@attr"?: { rank?: string };
};

export type Attributes = { user?: string; total?: string };

export class LastfmError extends Error {
	status: number;

	constructor(message: string, status = 502) {
		super(message);
		this.name = "LastfmError";
		this.status = status;
	}
}

const apiKey = () => {
	const { LAST_FM_API_KEY } = env;
	if (!LAST_FM_API_KEY)
		throw new LastfmError(
			"LAST_FM_API_KEY must be set in the environment",
			500,
		);

	return LAST_FM_API_KEY;
};

export const fetchApi = async (
	method: string,
	params: Record<string, string>,
	missing: string,
) => {
	const query = new URLSearchParams({
		method,
		api_key: apiKey(),
		format: "json",
		...params,
	});
	const res = await fetch(`${BASE_URL}?${query}`);
	const data = await res.json().catch(() => null);

	if (data?.error === 6) throw new LastfmError(missing, 404);
	if (data?.error)
		throw new LastfmError(
			`Last.fm responded with "${data.message || data.error}" for ${method}`,
			STATUS[data.error] || 502,
		);
	if (res.status !== 200)
		throw new LastfmError(
			`Last.fm responded with HTTP ${res.status} for ${method}`,
		);

	return data;
};

export const list = <T>(value: T | T[] | undefined | null): T[] => {
	if (Array.isArray(value)) return value;

	return value ? [value] : [];
};

export const limit = (value: string | null) => {
	const requested = Math.floor(Number(value));
	if (!Number.isFinite(requested) || requested < 1) return DEFAULT_LIMIT;

	return Math.min(requested, MAX_LIMIT);
};

export const period = (value: string | null): Period => {
	if (!value) return DEFAULT_PERIOD;
	if (value in PERIODS) return value as Period;

	throw new LastfmError(
		`period must be one of ${Object.keys(PERIODS).join(", ")}`,
		400,
	);
};

export const artwork = (images: Image[] | undefined) => {
	const url = [...list(images)]
		.reverse()
		.map((image) => image["#text"])
		.find(Boolean);

	return url && !url.includes(ARTWORK_PLACEHOLDER) ? url : null;
};

export const artistName = (
	artist: { name?: string; "#text"?: string } | undefined,
) => artist?.name || artist?.["#text"] || null;

export const toNumber = (value: string | undefined | null) => {
	const parsed = Number(value);

	return Number.isFinite(parsed) ? parsed : null;
};

export const toIsoDate = (seconds: string | undefined | null) => {
	const parsed = toNumber(seconds);

	return parsed ? new Date(parsed * 1000).toISOString() : null;
};

export const profileUrl = (user: string) =>
	`${PROFILE_URL}/${encodeURIComponent(user)}`;

export const parseUser = (attributes: Attributes | undefined, user: string) => {
	const username = attributes?.user || user;

	return { username, url: profileUrl(username) };
};
