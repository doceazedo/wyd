import { env } from "$env/dynamic/private";
import { read, write } from "$lib/server/cache";
import { SPOTIFY_IMAGE_CACHE_DAYS } from "$lib/services";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_URL = "https://api.spotify.com/v1";

const DURATION = SPOTIFY_IMAGE_CACHE_DAYS * 24 * 60 * 60 * 1000;
const CONCURRENCY = 8;
const RESULTS = 5;

type Type = "artist" | "album" | "track";

type Image = { url?: string };

type Match = { name?: string; images?: Image[] };

type Results = {
	artists?: { items?: Match[] };
	albums?: { items?: Match[] };
	tracks?: { items?: { name?: string; album?: { images?: Image[] } }[] };
};

type Token = { value: string; expiresAt: number };

export type Cover = {
	artist: string | null;
	album: string | null;
	track: string | null;
};

export type Images = Map<string, string | null>;

let token: Token | null = null;

const credentials = () => {
	const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = env;
	if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) return null;

	return btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
};

const accessToken = async () => {
	if (token && token.expiresAt > Date.now()) return token.value;

	const basic = credentials();
	if (!basic) return null;

	const res = await fetch(TOKEN_URL, {
		method: "POST",
		headers: {
			Authorization: `Basic ${basic}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({ grant_type: "client_credentials" }),
	});
	if (res.status !== 200) return null;

	const data = await res.json().catch(() => null);
	if (!data?.access_token) return null;

	token = {
		value: data.access_token,
		expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000 - 60000,
	};

	return token.value;
};

const matches = (results: Results | null, type: Type): Match[] => {
	if (type === "artist") return results?.artists?.items || [];
	if (type === "album") return results?.albums?.items || [];

	return (results?.tracks?.items || []).map((item) => ({
		name: item.name,
		images: item.album?.images,
	}));
};

const search = async (query: string, type: Type): Promise<Match[] | null> => {
	const bearer = await accessToken();
	if (!bearer) return null;

	const params = new URLSearchParams({ q: query, type, limit: `${RESULTS}` });
	const res = await fetch(`${API_URL}/search?${params}`, {
		headers: { Authorization: `Bearer ${bearer}` },
	});
	if (res.status === 401) token = null;
	if (res.status !== 200) return null;

	return matches(await res.json().catch(() => null), type);
};

const same = (value: string | undefined, expected: string) =>
	(value || "").trim().toLowerCase() === expected.trim().toLowerCase();

const image = (match: Match | undefined) =>
	match?.images?.[1]?.url || match?.images?.[0]?.url || null;

const lookup = async (query: string, type: Type, name: string) => {
	const items = await search(query, type);
	if (!items) return undefined;

	return image(items.find((item) => same(item.name, name)) || items[0]);
};

const cached = async (
	key: string,
	find: () => Promise<string | null | undefined>,
) => {
	const hit = await read(`spotify:${key}`);
	if (typeof hit?.value === "string") return hit.value || null;

	const url = await find();
	if (url === undefined) return null;

	await write(`spotify:${key}`, url || "", DURATION);

	return url;
};

const chunk = <T>(items: T[], size: number) =>
	items.reduce<T[][]>((groups, item, index) => {
		if (index % size === 0) groups.push([]);
		groups[groups.length - 1].push(item);

		return groups;
	}, []);

const mapLimited = <T, R>(items: T[], load: (item: T) => Promise<R>) =>
	chunk(items, CONCURRENCY).reduce(
		async (previous, group) => [
			...(await previous),
			...(await Promise.all(group.map(load))),
		],
		Promise.resolve<R[]>([]),
	);

const artistKey = (name: string) => `artist:${name.toLowerCase()}`;

export const coverKey = (cover: Cover) => {
	const artist = (cover.artist || "").toLowerCase();
	if (cover.album) return `album:${artist}:${cover.album.toLowerCase()}`;

	return cover.track ? `track:${artist}:${cover.track.toLowerCase()}` : null;
};

export const artistImages = async (names: (string | null)[]) => {
	const unique = [...new Set(names.filter((name): name is string => !!name))];
	const entries = await mapLimited(unique, async (name) => {
		const url = await cached(artistKey(name), () =>
			lookup(name, "artist", name),
		);

		return [artistKey(name), url] as const;
	});

	return new Map(entries) as Images;
};

export const covers = async (items: Cover[]) => {
	const unique = [
		...new Map(
			items.flatMap((cover) => {
				const key = coverKey(cover);

				return key ? [[key, cover] as const] : [];
			}),
		),
	];
	const entries = await mapLimited(unique, async ([key, cover]) => {
		const [type, name] = cover.album
			? (["album", cover.album] as const)
			: (["track", cover.track as string] as const);
		const query = [name, cover.artist].filter(Boolean).join(" ");
		const url = await cached(key, () => lookup(query, type, name));

		return [key, url] as const;
	});

	return new Map(entries) as Images;
};

export const artistImageOf = (images: Images, name: string | null) =>
	name ? images.get(artistKey(name)) || null : null;

export const coverOf = (images: Images, cover: Cover) => {
	const key = coverKey(cover);

	return key ? images.get(key) || null : null;
};
