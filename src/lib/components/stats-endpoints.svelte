<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as Table from "$lib/components/ui/table";
	import { m } from "$lib/paraglide/messages.js";
	import { SERVICES } from "$lib/services";
	import {
		average,
		count,
		dateTime,
		duration,
		share,
		type EndpointStats,
	} from "$lib/stats";

	const LIMIT = 10;

	type Props = { endpoints: EndpointStats[] };

	let { endpoints }: Props = $props();

	let expanded = $state(false);

	const rows = $derived(expanded ? endpoints : endpoints.slice(0, LIMIT));

	const title = (service: string) =>
		SERVICES[service as keyof typeof SERVICES]?.title ?? service;
</script>

<div class="flex flex-col gap-2">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>{m.stats_column_service()}</Table.Head>
				<Table.Head>{m.stats_column_endpoint()}</Table.Head>
				<Table.Head class="text-right">{m.stats_column_requests()}</Table.Head>
				<Table.Head class="text-right">{m.stats_column_hit_rate()}</Table.Head>
				<Table.Head class="text-right">{m.stats_column_time()}</Table.Head>
				<Table.Head class="text-right">{m.stats_column_errors()}</Table.Head>
				<Table.Head class="text-right">{m.stats_column_profiles()}</Table.Head>
				<Table.Head class="text-right"
					>{m.stats_column_last_request()}</Table.Head
				>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each rows as endpoint (`${endpoint.service}/${endpoint.endpoint}`)}
				<Table.Row>
					<Table.Cell class="font-medium">{title(endpoint.service)}</Table.Cell>
					<Table.Cell class="font-mono">{endpoint.endpoint}</Table.Cell>
					<Table.Cell class="text-right tabular-nums"
						>{count(endpoint.requests)}</Table.Cell
					>
					<Table.Cell class="text-right tabular-nums"
						>{share(endpoint.hits, endpoint.requests)}</Table.Cell
					>
					<Table.Cell class="text-right tabular-nums"
						>{duration(
							average(endpoint.totalDuration, endpoint.requests),
						)}</Table.Cell
					>
					<Table.Cell class="text-right tabular-nums"
						>{count(endpoint.errors)}</Table.Cell
					>
					<Table.Cell class="text-right tabular-nums"
						>{count(endpoint.users)}</Table.Cell
					>
					<Table.Cell class="text-right tabular-nums opacity-80">
						{endpoint.lastAt ? dateTime(endpoint.lastAt) : "-"}
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>

	{#if endpoints.length > LIMIT}
		<div class="flex justify-end">
			<Button size="sm" onclick={() => (expanded = !expanded)}>
				{expanded ? m.stats_see_less() : m.stats_see_all()}
			</Button>
		</div>
	{/if}
</div>
