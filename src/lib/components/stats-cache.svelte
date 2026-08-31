<script lang="ts">
	import { PieChart, Text } from "layerchart";
	import * as Chart from "$lib/components/ui/chart";
	import { m } from "$lib/paraglide/messages.js";
	import { fresh, share, type Totals } from "$lib/stats";

	type Props = { totals: Totals };

	let { totals }: Props = $props();

	const config = $derived({
		cached: { label: m.stats_cached(), color: "var(--chart-4)" },
		fresh: { label: m.stats_fresh(), color: "var(--chart-2)" },
		errors: { label: m.stats_errors(), color: "var(--destructive)" },
	} satisfies Chart.ChartConfig);

	const values = $derived({
		cached: totals.hits,
		fresh: fresh(totals),
		errors: totals.errors,
	});

	const data = $derived(
		Object.entries(config).flatMap(([key, { color }]) =>
			values[key as keyof typeof values]
				? [{ key, color, value: values[key as keyof typeof values] }]
				: [],
		),
	);
</script>

<Chart.Container {config} class="mx-auto aspect-square w-full max-w-64">
	<PieChart
		{data}
		key="key"
		value="value"
		c="color"
		innerRadius={64}
		padding={16}
		props={{ pie: { motion: "tween" } }}
	>
		{#snippet aboveMarks()}
			<Text
				value={share(totals.hits, totals.requests)}
				textAnchor="middle"
				verticalAnchor="middle"
				class="fill-foreground text-2xl! font-medium"
				dy={-2}
			/>
			<Text
				value={m.stats_cached()}
				textAnchor="middle"
				verticalAnchor="middle"
				class="fill-muted-foreground! text-muted-foreground"
				dy={20}
			/>
		{/snippet}
		{#snippet tooltip()}
			<Chart.Tooltip hideLabel />
		{/snippet}
	</PieChart>
</Chart.Container>

<div class="flex flex-wrap justify-center gap-4 text-xs">
	{#each Object.entries(config) as [key, { label, color }] (key)}
		<span class="flex items-center gap-1.5">
			<i class="size-2.5" style="background:{color}"></i>
			<span class="opacity-80">{label}</span>
			<span class="font-medium tabular-nums">
				{share(values[key as keyof typeof values], totals.requests)}
			</span>
		</span>
	{/each}
</div>
