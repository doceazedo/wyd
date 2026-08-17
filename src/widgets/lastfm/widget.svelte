<script lang="ts">
	import { endpoint } from "../shared/api";
	import Grid from "../shared/grid.svelte";
	import { translations } from "../shared/i18n";
	import { resource } from "../shared/resource.svelte";
	import type { Item, WidgetProps } from "../shared/types";
	import NowPlaying from "./now-playing.svelte";

	type Entry = {
		name: string | null;
		artist?: string | null;
		image: string | null;
		url: string | null;
		plays?: number | null;
	};

	type Payload = {
		nowPlaying?: Entry | null;
		tracks?: Entry[];
		artists?: Entry[];
		albums?: Entry[];
	};

	const NOW_PLAYING = "now-playing";
	const RECENT_TRACKS = "recent-tracks";
	const DEFAULT_GRID = "4x2";
	const DEFAULT_PERIOD = "7d";

	const LISTS = {
		"recent-tracks": "tracks",
		"top-tracks": "tracks",
		"top-artists": "artists",
		"top-albums": "albums",
	} as const;

	const GRIDS = {
		"4x2": { columns: 4, rows: 2 },
		"5x5": { columns: 5, rows: 5 },
		"10x10": { columns: 10, rows: 10 },
	} as const;

	let {
		api,
		user = "",
		grid = DEFAULT_GRID,
		kind = NOW_PLAYING,
		period = DEFAULT_PERIOD,
		labels = "true",
		lang,
	}: WidgetProps = $props();

	const t = $derived(translations(lang));
	const live = $derived(kind === NOW_PLAYING);
	const key = $derived(
		kind in LISTS ? (kind as keyof typeof LISTS) : RECENT_TRACKS,
	);
	const size = $derived(
		GRIDS[grid as keyof typeof GRIDS] || GRIDS[DEFAULT_GRID],
	);
	const limit = $derived(live ? 1 : size.columns * size.rows);

	const path = $derived.by(() => {
		if (!user) return null;

		const name = live ? RECENT_TRACKS : key;
		const query = [
			`limit=${limit}`,
			...(!live && key !== RECENT_TRACKS
				? [`period=${encodeURIComponent(period)}`]
				: []),
		].join("&");

		return `/api/lastfm/${encodeURIComponent(user)}/${name}?${query}`;
	});

	const data = resource<Payload>(() => (path ? endpoint(api, path) : null));

	const playing = $derived(data.data?.nowPlaying || null);
	const current = $derived(playing || data.data?.tracks?.[0] || null);

	const entries = $derived<Entry[]>(
		key === RECENT_TRACKS
			? [...(playing ? [playing] : []), ...(data.data?.tracks || [])]
			: data.data?.[LISTS[key]] || [],
	);

	const items = $derived<Item[]>(
		entries.slice(0, limit).map((entry, index) => ({
			id: `${index}`,
			title: entry.name || "",
			subtitle:
				entry.artist || (entry.plays ? t.scrobbles(`${entry.plays}`) : null),
			rating: null,
			image: entry.image,
			url: entry.url || "",
		})),
	);

	const empty = $derived.by(() => {
		if (key === "top-artists") return t.emptyArtists;
		if (key === "top-albums") return t.emptyAlbums;

		return t.emptyTracks;
	});
</script>

{#if live}
	<NowPlaying
		title={current?.name || null}
		subtitle={current?.artist || null}
		image={current?.image || null}
		url={current?.url || null}
		live={!!playing}
		label={t.nowPlaying}
		loading={data.loading}
		error={data.error}
		empty={t.emptyTracks}
	/>
{:else}
	<Grid
		{items}
		loading={data.loading}
		error={data.error}
		count={size.columns}
		rows={size.rows}
		ratio="1 / 1"
		labels={labels !== "false"}
		{empty}
	/>
{/if}
