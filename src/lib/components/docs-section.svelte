<script lang="ts">
	import type { Snippet } from "svelte";

	type Props = { title: string; children: Snippet };

	let { title, children }: Props = $props();
</script>

<section class="flex flex-col gap-4">
	<h2 class="text-2xl font-medium md:text-3xl">{title}</h2>
	{@render children()}
</section>
