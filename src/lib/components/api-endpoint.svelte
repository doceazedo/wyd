<script lang="ts">
	import { page } from "$app/state";
	import CodeBlock from "$lib/components/code-block.svelte";
	import OptionsTable from "$lib/components/options-table.svelte";
	import { Button } from "$lib/components/ui/button";
	import { m } from "$lib/paraglide/messages.js";
	import {
		endpointUrl,
		paramOption,
		HOUR,
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

	const cache = $derived.by(() => {
		if (endpoint.cache < HOUR)
			return m.docs_cache_seconds({ count: endpoint.cache });

		const hours = endpoint.cache / HOUR;

		return hours === 1
			? m.docs_cache_hour()
			: m.docs_cache_hours({ count: hours });
	});

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
		{#if endpoint.description()}
			<p class="mt-1 text-foreground/80">{endpoint.description()}</p>
		{/if}
		<p class="mt-1 text-foreground/80">
			<b class="font-medium text-foreground">{m.docs_cache()}</b>
			{cache}
		</p>
	</hgroup>

	<CodeBlock code={url}>
		<Button variant="outline" onclick={send} disabled={loading}>
			<RiPlayLine />
			{loading ? m.docs_sending() : m.docs_send()}
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
		<OptionsTable label={m.docs_parameter()} {options} bind:values />
	{/if}
</article>
