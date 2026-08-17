<script lang="ts">
	import { page } from "$app/state";
	import CodeBlock from "$lib/components/code-block.svelte";
	import OptionsTable from "$lib/components/options-table.svelte";
	import { Button } from "$lib/components/ui/button";
	import {
		endpointUrl,
		paramOption,
		type Endpoint,
		type Service,
		type WidgetValues,
	} from "$lib/services";
	import { RiPlayLine } from "remixicon-svelte";
	import { untrack } from "svelte";
	import { fetchJson } from "../../widgets/shared/api";

	type Props = { service: Service; endpoint: Endpoint };

	let { service, endpoint }: Props = $props();

	const options = $derived(
		endpoint.params.map((param) => paramOption(service, param)),
	);

	let values = $state<WidgetValues>(
		untrack(() =>
			Object.fromEntries(
				options.map((option) => [option.attribute, option.value]),
			),
		),
	);
	let response = $state<string | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(false);

	const url = $derived(endpointUrl(endpoint, values, page.url.origin));

	const send = async () => {
		loading = true;
		error = null;

		try {
			response = JSON.stringify(await fetchJson(url), null, 2);
		} catch (reason) {
			response = null;
			error = reason instanceof Error ? reason.message : String(reason);
		} finally {
			loading = false;
		}
	};
</script>

<article class="flex flex-col gap-4">
	<hgroup>
		<h3 class="flex flex-wrap items-center gap-2 font-mono text-lg">
			<span class="border px-1.5 py-0.5 text-xs font-medium">GET</span>
			<span class="min-w-0 break-all">{endpoint.path}</span>
		</h3>
		{#if endpoint.description}
			<p class="mt-1 opacity-80">{endpoint.description}</p>
		{/if}
	</hgroup>

	<CodeBlock code={url}>
		<Button variant="outline" onclick={send} disabled={loading}>
			<RiPlayLine />
			{loading ? "Sending..." : "Send"}
		</Button>
	</CodeBlock>

	{#if error}
		<p class="border border-destructive/40 bg-destructive/10 p-3 text-sm">
			{error}
		</p>
	{:else if response}
		<CodeBlock code={response} />
	{/if}

	{#if options.length}
		<OptionsTable label="Parameter" {options} bind:values />
	{/if}
</article>
