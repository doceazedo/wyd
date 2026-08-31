<script lang="ts">
	import { AreaChart } from "layerchart";
	import * as Chart from "$lib/components/ui/chart";
	import { m } from "$lib/paraglide/messages.js";
	import { fresh, type SeriesPoint } from "$lib/stats";

	type Props = {
		points: SeriesPoint[];
		format: (value: Date | string) => string;
	};

	let { points, format }: Props = $props();

	const config = $derived({
		cached: { label: m.stats_cached(), color: "var(--chart-4)" },
		fresh: { label: m.stats_fresh(), color: "var(--chart-2)" },
		errors: { label: m.stats_errors(), color: "var(--destructive)" },
	} satisfies Chart.ChartConfig);

	const series = $derived(
		Object.entries(config).map(([key, { label, color }]) => ({
			key,
			label,
			color,
		})),
	);

	const data = $derived(
		points.map((point) => ({
			date: new Date(point.at),
			cached: point.hits,
			fresh: fresh(point),
			errors: point.errors,
		})),
	);
</script>

<Chart.Container {config} class="h-64 w-full">
	<AreaChart
		{data}
		{series}
		x="date"
		axis="x"
		legend
		seriesLayout="stack"
		yPadding={[0, 8]}
		props={{
			area: {
				"fill-opacity": 0.4,
				line: { class: "stroke-1" },
				motion: "tween",
			},
			xAxis: { format },
		}}
	>
		{#snippet tooltip()}
			<Chart.Tooltip indicator="dot" labelFormatter={format} />
		{/snippet}
	</AreaChart>
</Chart.Container>
