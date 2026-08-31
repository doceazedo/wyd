<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as Table from "$lib/components/ui/table";
	import { m } from "$lib/paraglide/messages.js";
	import {
		average,
		count,
		dateTime,
		duration,
		share,
		type OriginStats,
	} from "$lib/stats";

	const LIMIT = 10;

	type Props = { origins: OriginStats[] };

	let { origins }: Props = $props();

	let expanded = $state(false);

	const rows = $derived(expanded ? origins : origins.slice(0, LIMIT));
</script>

<div class="flex flex-col gap-2">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>{m.stats_column_origin()}</Table.Head>
				<Table.Head class="text-right">{m.stats_column_requests()}</Table.Head>
				<Table.Head class="text-right">{m.stats_column_hit_rate()}</Table.Head>
				<Table.Head class="text-right">{m.stats_column_time()}</Table.Head>
				<Table.Head class="text-right">{m.stats_column_errors()}</Table.Head>
				<Table.Head class="text-right"
					>{m.stats_column_last_request()}</Table.Head
				>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each rows as origin (origin.host)}
				<Table.Row>
					<Table.Cell class={origin.host ? "font-mono" : "font-medium"}>
						{origin.host || m.stats_origin_direct()}
					</Table.Cell>
					<Table.Cell class="text-right tabular-nums"
						>{count(origin.requests)}</Table.Cell
					>
					<Table.Cell class="text-right tabular-nums"
						>{share(origin.hits, origin.requests)}</Table.Cell
					>
					<Table.Cell class="text-right tabular-nums"
						>{duration(
							average(origin.totalDuration, origin.requests),
						)}</Table.Cell
					>
					<Table.Cell class="text-right tabular-nums"
						>{count(origin.errors)}</Table.Cell
					>
					<Table.Cell class="text-right tabular-nums opacity-80">
						{origin.lastAt ? dateTime(origin.lastAt) : "-"}
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>

	{#if origins.length > LIMIT}
		<div class="flex justify-end">
			<Button size="sm" onclick={() => (expanded = !expanded)}>
				{expanded ? m.stats_see_less() : m.stats_see_all()}
			</Button>
		</div>
	{/if}
</div>
