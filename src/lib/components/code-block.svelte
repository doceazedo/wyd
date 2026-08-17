<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { m } from "$lib/paraglide/messages.js";
	import { RiCheckLine, RiFileCopyLine } from "remixicon-svelte";
	import type { Snippet } from "svelte";

	type Props = { code: string; children?: Snippet };

	let { code, children }: Props = $props();
	let copied = $state(false);

	const copy = async () => {
		await navigator.clipboard.writeText(code);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	};
</script>

<div class="flex items-start gap-3 border bg-muted p-3">
	<pre class="max-h-96 w-full min-w-0 overflow-auto py-1.5 text-sm"><code
			>{code}</code
		></pre>
	<div class="flex shrink-0 items-center gap-2">
		{@render children?.()}
		<Button onclick={copy}>
			{#if copied}
				<RiCheckLine />
				{m.docs_copied()}
			{:else}
				<RiFileCopyLine />
				{m.docs_copy()}
			{/if}
		</Button>
	</div>
</div>
