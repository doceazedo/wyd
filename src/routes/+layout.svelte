<script lang="ts">
	import type { Pathname } from "$app/types";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import {
		locales,
		localizeHref,
		shouldRedirect,
	} from "$lib/paraglide/runtime";
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import { onMount } from "svelte";
	import { afterNavigate } from "$app/navigation";

	let { children } = $props();

	const syncLocaleUrl = async (url: string) => {
		const decision = await shouldRedirect({ url });

		if (decision.shouldRedirect && decision.redirectUrl) {
			window.location.href = decision.redirectUrl.href;
		}
	};

	onMount(() => {
		syncLocaleUrl(window.location.href);
	});

	afterNavigate((navigation) => {
		if (navigation.to) {
			syncLocaleUrl(navigation.to.url.href);
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}
			>{locale}</a
		>
	{/each}
</div>

<div class="mx-auto max-w-5xl p-3 md:px-12 xl:px-0">
	{@render children()}
</div>
