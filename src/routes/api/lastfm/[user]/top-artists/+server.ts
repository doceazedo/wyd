import { error, json } from "@sveltejs/kit";
import {
	LastfmError,
	PERIODS,
	fetchApi,
	limit,
	list,
	parseUser,
	period,
	toNumber,
	type RawArtist,
} from "$lib/services/lastfm";
import {
	artistImageOf,
	artistImages,
	type Images,
} from "$lib/services/spotify";
import type { RequestHandler } from "./$types";

type Artist = {
	rank: number | null;
	name: string | null;
	image: string | null;
	url: string | null;
	plays: number | null;
};

const parseArtist = (artist: RawArtist, images: Images): Artist => ({
	rank: toNumber(artist["@attr"]?.rank),
	name: artist.name || null,
	image: artistImageOf(images, artist.name || null),
	url: artist.url || null,
	plays: toNumber(artist.playcount),
});

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const count = limit(url.searchParams.get("limit"));
		const key = period(url.searchParams.get("period"));
		const data = await fetchApi(
			"user.gettopartists",
			{ user: params.user, period: PERIODS[key], limit: `${count}` },
			`there is no Last.fm user named "${params.user}"`,
		);

		const artists = list<RawArtist>(data?.topartists?.artist).slice(0, count);
		const images = await artistImages(
			artists.map((artist) => artist.name || null),
		);

		return json({
			user: parseUser(data?.topartists?.["@attr"], params.user),
			period: key,
			total: toNumber(data?.topartists?.["@attr"]?.total),
			artists: artists.map((artist) => parseArtist(artist, images)),
		});
	} catch (err) {
		if (err instanceof LastfmError) error(err.status, err.message);
		throw err;
	}
};
