<script lang="ts">
	import { endpoint } from "../shared/api";
	import Grid from "../shared/grid.svelte";
	import { translations } from "../shared/i18n";
	import { resource } from "../shared/resource.svelte";
	import type { Item, WidgetProps } from "../shared/types";

	type Game = {
		id: string;
		name: string | null;
		cover: string | null;
		header: string | null;
		playtime2Weeks: number;
		url: string;
	};

	type RecentlyPlayed = { games: Game[] };

	const MAX_COUNT = 4;

	let {
		api,
		user = "",
		count = "4",
		labels = "true",
		lang,
	}: WidgetProps = $props();

	const t = $derived(translations(lang));
	const limit = $derived(Math.min(Number(count) || MAX_COUNT, MAX_COUNT));

	const played = resource<RecentlyPlayed>(() =>
		user
			? endpoint(api, `/api/steam/${encodeURIComponent(user)}/recently-played`)
			: null,
	);

	const playtime = (minutes: number) => {
		if (!minutes) return null;
		if (minutes < 60) return t.playtimeMinutes(`${minutes}`);

		return t.playtimeHours(`${Math.round(minutes / 6) / 10}`);
	};

	const games = $derived<Item[]>(
		(played.data?.games || []).slice(0, limit).map((game) => ({
			id: game.id,
			title: game.name || game.id,
			subtitle: playtime(game.playtime2Weeks),
			rating: null,
			image: game.cover || game.header,
			url: game.url,
		})),
	);
</script>

<Grid
	items={games}
	loading={played.loading}
	error={played.error}
	count={limit}
	labels={labels !== "false"}
	empty={t.emptyGames}
/>
