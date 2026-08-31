<script lang="ts">
	import DocsSection from "$lib/components/docs-section.svelte";
	import StatCard from "$lib/components/stat-card.svelte";
	import StatsBars from "$lib/components/stats-bars.svelte";
	import StatsCache from "$lib/components/stats-cache.svelte";
	import StatsEndpoints from "$lib/components/stats-endpoints.svelte";
	import StatsOrigins from "$lib/components/stats-origins.svelte";
	import StatsTimeline from "$lib/components/stats-timeline.svelte";
	import * as Card from "$lib/components/ui/card";
	import * as Select from "$lib/components/ui/select";
	import { m } from "$lib/paraglide/messages.js";
	import { SERVICES } from "$lib/services";
	import {
		average,
		count,
		DEFAULT_PERIOD,
		duration,
		hourTime,
		period,
		PERIODS,
		share,
		shortDate,
		sum,
		type PeriodKey,
		type Stats,
	} from "$lib/stats";

	const TOP_ORIGINS = 8;

	type Props = { stats: Stats };

	let { stats }: Props = $props();

	let selected = $state<string>(DEFAULT_PERIOD);

	const LABELS: Record<PeriodKey, () => string> = {
		today: m.stats_period_today,
		weeks: m.stats_period_weeks,
		month: m.stats_period_month,
		year: m.stats_period_year,
	};

	const current = $derived(period(selected));

	const hourly = $derived(current.days === 1);

	const points = $derived(
		hourly ? stats.hours : stats.days.slice(-current.days),
	);

	const totals = $derived(sum(points));

	const scope = $derived(stats.periods[current.key]);

	const tag = $derived(hourly ? m.stats_today() : undefined);

	const title = (service: string) =>
		SERVICES[service as keyof typeof SERVICES]?.title ?? service;

	const services = $derived(
		scope.services.map((service) => ({
			name: title(service.service),
			value: service.requests,
		})),
	);

	const top = $derived(scope.origins.slice(0, TOP_ORIGINS));

	const tail = $derived(scope.origins.slice(TOP_ORIGINS));

	const origins = $derived([
		...top.map((origin) => ({
			name: origin.host || m.stats_origin_direct(),
			value: origin.requests,
		})),
		...(tail.length
			? [
					{
						name: m.stats_origin_other(),
						value: tail.reduce((total, origin) => total + origin.requests, 0),
					},
				]
			: []),
	]);
</script>

{#if !stats.totals.requests}
	<p class="mt-6 leading-7 opacity-80">{m.stats_empty()}</p>
{:else}
	<div class="mt-6 flex justify-end">
		<Select.Root type="single" bind:value={selected}>
			<Select.Trigger class="w-48" aria-label={m.stats_period_label()}>
				{LABELS[current.key]()}
			</Select.Trigger>
			<Select.Content>
				{#each PERIODS as option (option.key)}
					<Select.Item value={option.key} label={LABELS[option.key]()}>
						{LABELS[option.key]()}
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<div class="mt-6 flex flex-col gap-6">
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
			<StatCard label={m.stats_requests()} value={count(totals.requests)} />
			<StatCard
				label={m.stats_hit_rate()}
				value={share(totals.hits, totals.requests)}
			/>
			<StatCard
				label={m.stats_response_time()}
				value={duration(average(totals.totalDuration, totals.requests))}
			/>
			<StatCard label={m.stats_errors()} value={count(totals.errors)} />
			<StatCard
				label={m.stats_rate_limited()}
				value={count(totals.rateLimited)}
			/>
			<StatCard label={m.stats_profiles()} value={count(scope.profiles)} />
		</div>

		<Card.Root>
			<Card.Content>
				<StatsTimeline {points} format={hourly ? hourTime : shortDate} />
			</Card.Content>
		</Card.Root>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<DocsSection title={m.stats_cache_title()}>
				<Card.Root class="flex h-full flex-col justify-center">
					<Card.Content class="flex flex-col gap-4">
						<StatsCache {totals} />
					</Card.Content>
				</Card.Root>
			</DocsSection>

			<DocsSection title={m.stats_services_title()} {tag}>
				<Card.Root class="flex h-full flex-col justify-center">
					<Card.Content>
						<StatsBars
							label={m.stats_column_requests()}
							data={services}
							format={count}
						/>
					</Card.Content>
				</Card.Root>
			</DocsSection>
		</div>

		{#if scope.origins.length}
			<DocsSection title={m.stats_origins_title()} {tag}>
				<Card.Root>
					<Card.Content>
						<StatsBars
							label={m.stats_column_requests()}
							data={origins}
							format={count}
						/>
					</Card.Content>
				</Card.Root>
				<StatsOrigins origins={scope.origins} />
			</DocsSection>
		{/if}

		<DocsSection title={m.stats_endpoints_title()} {tag}>
			<StatsEndpoints endpoints={scope.endpoints} />
		</DocsSection>
	</div>
{/if}
