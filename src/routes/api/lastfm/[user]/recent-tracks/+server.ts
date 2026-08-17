import { error, json } from "@sveltejs/kit";
import {
	LastfmError,
	artistName,
	artwork,
	fetchApi,
	limit,
	list,
	parseUser,
	toIsoDate,
	toNumber,
	type RawTrack,
} from "$lib/services/lastfm";
import { coverOf, covers, type Images } from "$lib/services/spotify";
import type { RequestHandler } from "./$types";

const MAX_AGE = 90;

type Track = {
	name: string | null;
	artist: string | null;
	album: string | null;
	image: string | null;
	url: string | null;
	playedAt: string | null;
};

const isPlaying = (track: RawTrack) => track["@attr"]?.nowplaying === "true";

const toCover = (track: RawTrack) => ({
	artist: artistName(track.artist),
	album: track.album?.["#text"] || null,
	track: track.name || null,
});

const parseTrack = (track: RawTrack, images: Images): Track => {
	const cover = toCover(track);

	return {
		name: cover.track,
		artist: cover.artist,
		album: cover.album,
		image: coverOf(images, cover) || artwork(track.image),
		url: track.url || null,
		playedAt: toIsoDate(track.date?.uts),
	};
};

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const count = limit(url.searchParams.get("limit"));
		const data = await fetchApi(
			"user.getrecenttracks",
			{ user: params.user, limit: `${count + 1}` },
			`there is no Last.fm user named "${params.user}"`,
		);

		const tracks = list<RawTrack>(data?.recenttracks?.track);
		const playing = tracks.find(isPlaying) || null;
		const played = tracks.filter((track) => !isPlaying(track)).slice(0, count);
		const images = await covers(
			[...(playing ? [playing] : []), ...played].map(toCover),
		);

		return json(
			{
				user: parseUser(data?.recenttracks?.["@attr"], params.user),
				total: toNumber(data?.recenttracks?.["@attr"]?.total),
				nowPlaying: playing ? parseTrack(playing, images) : null,
				tracks: played.map((track) => parseTrack(track, images)),
			},
			{ headers: { "Cache-Control": `public, max-age=${MAX_AGE}` } },
		);
	} catch (err) {
		if (err instanceof LastfmError) error(err.status, err.message);
		throw err;
	}
};
