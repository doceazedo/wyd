import { error, json } from "@sveltejs/kit";
import {
	COMMUNITY_URL,
	SteamError,
	assets,
	fetchApi,
	fetchAssets,
	fetchOwnedGames,
	fetchPlayer,
	resolveSteamId,
	storeUrl,
	toIsoDate,
	username,
	type Assets,
	type OwnedGame,
	type Player,
} from "$lib/services/steam";
import type { RequestHandler } from "./$types";

type Game = {
	id: string;
	name: string | null;
	icon: string | null;
	cover: string | null;
	cover2x: string | null;
	header: string | null;
	header2x: string | null;
	playtime2Weeks: number;
	playtimeForever: number;
	lastPlayedAt: string | null;
	url: string;
};

const parseUser = (player: Player) => ({
	id: player.steamid,
	username: username(player.profileurl),
	name: player.personaname || null,
	avatar: player.avatarfull || null,
	url: player.profileurl || `${COMMUNITY_URL}/profiles/${player.steamid}`,
});

const parsePlaying = (player: Player, catalog: Map<string, Assets>) => {
	if (!player.gameid) return null;

	return {
		id: player.gameid,
		name: player.gameextrainfo || null,
		...assets(catalog, player.gameid),
		url: storeUrl(player.gameid),
	};
};

const parseGame = (
	game: OwnedGame,
	catalog: Map<string, Assets>,
	lastPlayed: Map<number, number>,
): Game => ({
	id: game.appid.toString(),
	name: game.name || null,
	...assets(catalog, game.appid, game.img_icon_url),
	playtime2Weeks: game.playtime_2weeks || 0,
	playtimeForever: game.playtime_forever || 0,
	lastPlayedAt: toIsoDate(lastPlayed.get(game.appid)),
	url: storeUrl(game.appid),
});

export const GET: RequestHandler = async ({ params }) => {
	try {
		const steamId = await resolveSteamId(params.user);
		const [player, response] = await Promise.all([
			fetchPlayer(steamId),
			fetchApi("/IPlayerService/GetRecentlyPlayedGames/v1/", {
				steamid: steamId,
			}),
		]);

		const games: OwnedGame[] = response?.games || [];
		const appIds = games.map((game) => game.appid);
		const [owned, catalog] = await Promise.all([
			fetchOwnedGames(steamId, appIds),
			fetchAssets(player.gameid ? [...appIds, player.gameid] : appIds),
		]);
		const lastPlayed = new Map(
			owned
				.filter((game) => !!game.rtime_last_played)
				.map((game) => [game.appid, game.rtime_last_played as number]),
		);

		return json({
			user: parseUser(player),
			playing: parsePlaying(player, catalog),
			games: games.map((game) => parseGame(game, catalog, lastPlayed)),
		});
	} catch (err) {
		if (err instanceof SteamError) error(err.status, err.message);
		throw err;
	}
};
