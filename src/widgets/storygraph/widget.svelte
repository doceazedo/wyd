<script lang="ts">
	import { endpoint } from "../shared/api";
	import Grid from "../shared/grid.svelte";
	import { translations } from "../shared/i18n";
	import { resource } from "../shared/resource.svelte";
	import type { Item, WidgetProps } from "../shared/types";

	const LISTS = {
		"currently-reading": "currentlyReading",
		read: "read",
		"to-read": "toRead",
		"five-star-reads": "fiveStarReads",
		owned: "owned",
	} as const;

	type Book = {
		id: string;
		title: string;
		author: string | null;
		cover: string | null;
		url: string;
	};

	type Profile = Record<(typeof LISTS)[keyof typeof LISTS], Book[]>;

	let {
		api,
		user = "",
		count = "5",
		list = "currently-reading",
		labels = "true",
		lang,
	}: WidgetProps = $props();

	const t = $derived(translations(lang));
	const limit = $derived(Number(count) || 5);
	const key = $derived(
		LISTS[list as keyof typeof LISTS] || LISTS["currently-reading"],
	);

	const profile = resource<Profile>(() =>
		user ? endpoint(api, `/api/storygraph/${encodeURIComponent(user)}`) : null,
	);

	const books = $derived<Item[]>(
		(profile.data?.[key] || []).slice(0, limit).map((book) => ({
			id: book.id,
			title: book.title,
			subtitle: book.author,
			rating: null,
			image: book.cover,
			url: book.url,
		})),
	);
</script>

<Grid
	items={books}
	loading={profile.loading}
	error={profile.error}
	count={limit}
	labels={labels !== "false"}
	empty={t.emptyBooks}
/>
