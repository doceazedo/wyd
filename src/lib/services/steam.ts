import { env } from "$env/dynamic/private";

export const BASE_URL = "https://api.steampowered.com";
export const COMMUNITY_URL = "https://steamcommunity.com";
export const STORE_URL = "https://store.steampowered.com";

const ASSETS_URL = "https://shared.fastly.steamstatic.com/store_item_assets/";
const ICONS_URL =
	"https://media.steampowered.com/steamcommunity/public/images/apps";

export type Player = {
	steamid: string;
	personaname?: string;
	profileurl?: string;
	avatarfull?: string;
	gameid?: string;
	gameextrainfo?: string;
};

export type OwnedGame = {
	appid: number;
	name?: string;
	img_icon_url?: string;
	playtime_2weeks?: number;
	playtime_forever?: number;
	rtime_last_played?: number;
};

export type StoreItem = {
	appid: number;
	assets?: {
		asset_url_format?: string;
		community_icon?: string;
		library_capsule?: string;
		library_capsule_2x?: string;
		header?: string;
		header_2x?: string;
	};
};

export type Assets = {
	icon: string | null;
	cover: string | null;
	cover2x: string | null;
	header: string | null;
	header2x: string | null;
};

export class SteamError extends Error {
	status: number;

	constructor(message: string, status = 502) {
		super(message);
		this.name = "SteamError";
		this.status = status;
	}
}

const apiKey = () => {
	const { STEAM_API_KEY } = env;
	if (!STEAM_API_KEY)
		throw new SteamError("STEAM_API_KEY must be set in the environment", 500);

	return STEAM_API_KEY;
};

export const fetchApi = async (
	path: string,
	params: Record<string, string>,
) => {
	const query = new URLSearchParams({
		key: apiKey(),
		format: "json",
		...params,
	});
	const res = await fetch(`${BASE_URL}${path}?${query}`);
	if (res.status === 401 || res.status === 403)
		throw new SteamError("Steam rejected the STEAM_API_KEY", 500);
	if (res.status !== 200)
		throw new SteamError(`Steam responded with HTTP ${res.status} for ${path}`);

	const data = await res.json();

	return data?.response || null;
};

const isSteamId = (value: string) =>
	value.length === 17 && [...value].every((char) => char >= "0" && char <= "9");

export const resolveSteamId = async (user: string) => {
	if (isSteamId(user)) return user;

	const response = await fetchApi("/ISteamUser/ResolveVanityURL/v1/", {
		vanityurl: user,
	});
	const steamId = response?.steamid;
	if (response?.success !== 1 || typeof steamId !== "string")
		throw new SteamError(`there is no Steam user named "${user}"`, 404);

	return steamId;
};

export const fetchPlayer = async (steamId: string): Promise<Player> => {
	const response = await fetchApi("/ISteamUser/GetPlayerSummaries/v2/", {
		steamids: steamId,
	});
	const player = response?.players?.[0];
	if (!player)
		throw new SteamError(
			`there is no Steam user with the id "${steamId}"`,
			404,
		);

	return player;
};

export const fetchOwnedGames = async (
	steamId: string,
	appIds: number[],
): Promise<OwnedGame[]> => {
	if (!appIds.length) return [];

	const response = await fetchApi("/IPlayerService/GetOwnedGames/v1/", {
		input_json: JSON.stringify({
			steamid: steamId,
			appids_filter: appIds,
			include_appinfo: true,
			include_played_free_games: true,
		}),
	});

	return response?.games || [];
};

const EMPTY_ASSETS: Assets = {
	icon: null,
	cover: null,
	cover2x: null,
	header: null,
	header2x: null,
};

const assetUrl = (format: string, filename: string | undefined | null) =>
	filename
		? `${ASSETS_URL}${format.split("${FILENAME}").join(filename)}`
		: null;

const parseAssets = (item: StoreItem): Assets => {
	const format = item.assets?.asset_url_format;
	if (!format || !item.assets) return EMPTY_ASSETS;

	const {
		community_icon,
		library_capsule,
		library_capsule_2x,
		header,
		header_2x,
	} = item.assets;

	return {
		icon: community_icon
			? `${ICONS_URL}/${item.appid}/${community_icon}.jpg`
			: null,
		cover: assetUrl(format, library_capsule),
		cover2x: assetUrl(format, library_capsule_2x),
		header: assetUrl(format, header),
		header2x: assetUrl(format, header_2x),
	};
};

export const fetchAssets = async (
	appIds: (number | string)[],
): Promise<Map<string, Assets>> => {
	const ids = [...new Set(appIds.map(Number))].filter(
		(appId) => Number.isSafeInteger(appId) && appId > 0,
	);
	if (!ids.length) return new Map();

	const response = await fetchApi("/IStoreBrowseService/GetItems/v1/", {
		input_json: JSON.stringify({
			ids: ids.map((appid) => ({ appid })),
			context: { language: "english", country_code: "US" },
			data_request: { include_assets: true },
		}),
	});
	const items: StoreItem[] = response?.store_items || [];

	return new Map(
		items.map((item) => [item.appid.toString(), parseAssets(item)]),
	);
};

export const assets = (
	catalog: Map<string, Assets>,
	appId: number | string,
	icon?: string | null,
): Assets => {
	const found = catalog.get(appId.toString()) || EMPTY_ASSETS;

	return {
		...found,
		icon: found.icon || (icon ? `${ICONS_URL}/${appId}/${icon}.jpg` : null),
	};
};

export const toIsoDate = (seconds: number | undefined | null) =>
	seconds ? new Date(seconds * 1000).toISOString() : null;

export const storeUrl = (appId: number | string) => `${STORE_URL}/app/${appId}`;

export const username = (profileUrl: string | undefined | null) => {
	const [segment, handle] = (profileUrl || "")
		.split("/")
		.filter(Boolean)
		.slice(-2);

	return segment === "id" && handle ? handle : null;
};
