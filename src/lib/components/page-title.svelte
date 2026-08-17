<script lang="ts">
	import type { Snippet } from "svelte";

	type Props = { children: Snippet };

	let { children }: Props = $props();
</script>

<h1 class="text-3xl font-medium lg:text-4xl">{@render children()}</h1>
