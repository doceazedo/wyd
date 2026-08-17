import { error, json } from "@sveltejs/kit";
import {
	LastfmError,
	PERIODS,
	artistName,
	artwork,
	fetchApi,
	limit,
	list,
	parseUser,
	period,
	toNumber,
	type RawTrack,
} from "$lib/services/lastfm";
import { coverOf, covers, type Images } from "$lib/services/spotify";
import type { RequestHandler } from "./$types";

type Track = {
	rank: number | null;
	name: string | null;
	artist: string | null;
	album: string | null;
	image: string | null;
	url: string | null;
	plays: number | null;
};

const toCover = (track: RawTrack) => ({
	artist: artistName(track.artist),
	album: track.album?.["#text"] || null,
	track: track.name || null,
});

const parseTrack = (track: RawTrack, images: Images): Track => {
	const cover = toCover(track);

	return {
		rank: toNumber(track["@attr"]?.rank),
		name: cover.track,
		artist: cover.artist,
		album: cover.album,
		image: coverOf(images, cover) || artwork(track.image),
		url: track.url || null,
		plays: toNumber(track.playcount),
	};
};

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const count = limit(url.searchParams.get("limit"));
		const key = period(url.searchParams.get("period"));
		const data = await fetchApi(
			"user.gettoptracks",
			{ user: params.user, period: PERIODS[key], limit: `${count}` },
			`there is no Last.fm user named "${params.user}"`,
		);

		const tracks = list<RawTrack>(data?.toptracks?.track).slice(0, count);
		const images = await covers(tracks.map(toCover));

		return json({
			user: parseUser(data?.toptracks?.["@attr"], params.user),
			period: key,
			total: toNumber(data?.toptracks?.["@attr"]?.total),
			tracks: tracks.map((track) => parseTrack(track, images)),
		});
	} catch (err) {
		if (err instanceof LastfmError) error(err.status, err.message);
		throw err;
	}
};
