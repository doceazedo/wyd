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
	type RawAlbum,
} from "$lib/services/lastfm";
import { coverOf, covers, type Images } from "$lib/services/spotify";
import type { RequestHandler } from "./$types";

type Album = {
	rank: number | null;
	name: string | null;
	artist: string | null;
	image: string | null;
	url: string | null;
	plays: number | null;
};

const toCover = (album: RawAlbum) => ({
	artist: artistName(album.artist),
	album: album.name || null,
	track: null,
});

const parseAlbum = (album: RawAlbum, images: Images): Album => {
	const cover = toCover(album);

	return {
		rank: toNumber(album["@attr"]?.rank),
		name: cover.album,
		artist: cover.artist,
		image: coverOf(images, cover) || artwork(album.image),
		url: album.url || null,
		plays: toNumber(album.playcount),
	};
};

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const count = limit(url.searchParams.get("limit"));
		const key = period(url.searchParams.get("period"));
		const data = await fetchApi(
			"user.gettopalbums",
			{ user: params.user, period: PERIODS[key], limit: `${count}` },
			`there is no Last.fm user named "${params.user}"`,
		);

		const albums = list<RawAlbum>(data?.topalbums?.album).slice(0, count);
		const images = await covers(albums.map(toCover));

		return json({
			user: parseUser(data?.topalbums?.["@attr"], params.user),
			period: key,
			total: toNumber(data?.topalbums?.["@attr"]?.total),
			albums: albums.map((album) => parseAlbum(album, images)),
		});
	} catch (err) {
		if (err instanceof LastfmError) error(err.status, err.message);
		throw err;
	}
};
