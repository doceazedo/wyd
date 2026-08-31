<script lang="ts">
	import type { Snippet } from "svelte";

	type Props = { title: string; tag?: string; children: Snippet };

	let { title, tag, children }: Props = $props();
</script>

<section class="flex flex-col gap-4">
	<h2 class="flex items-baseline gap-2 text-2xl font-medium md:text-3xl">
		{title}
		{#if tag}<span class="text-xs font-normal opacity-60">{tag}</span>{/if}
	</h2>
	{@render children()}
</section>
