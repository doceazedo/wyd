<script lang="ts">
	import { endpoint } from "../shared/api";
	import Grid from "../shared/grid.svelte";
	import { translations } from "../shared/i18n";
	import { resource } from "../shared/resource.svelte";
	import type { Item, WidgetProps } from "../shared/types";

	const LISTS = {
		recent: "recent",
		favorites: "favorites",
	} as const;

	type Entry = {
		slug: string;
		title: string;
		year: number | null;
		url: string;
		reviewUrl: string | null;
		poster: string | null;
		rating?: number | null;
	};

	type Profile = Record<(typeof LISTS)[keyof typeof LISTS], Entry[]>;

	const FAVORITES_COUNT = 4;

	let {
		api,
		user = "",
		count = "4",
		list = "recent",
		labels = "true",
		lang,
	}: WidgetProps = $props();

	const t = $derived(translations(lang));
	const key = $derived(LISTS[list as keyof typeof LISTS] || LISTS.recent);
	const limit = $derived(
		key === LISTS.favorites
			? Math.min(Number(count) || FAVORITES_COUNT, FAVORITES_COUNT)
			: Number(count) || 4,
	);

	const profile = resource<Profile>(() =>
		user ? endpoint(api, `/api/letterboxd/${encodeURIComponent(user)}`) : null,
	);

	const films = $derived<Item[]>(
		(profile.data?.[key] || []).slice(0, limit).map((entry) => ({
			id: entry.slug,
			title: entry.title,
			subtitle: entry.year ? `${entry.year}` : null,
			rating: entry.rating ?? null,
			image: entry.poster,
			url: key === LISTS.favorites ? entry.url : entry.reviewUrl || entry.url,
		})),
	);
</script>

<Grid
	items={films}
	loading={profile.loading}
	error={profile.error}
	count={limit}
	labels={labels !== "false"}
	empty={t.emptyFilms}
/>
