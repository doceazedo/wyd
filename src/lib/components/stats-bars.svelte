<script lang="ts">
	import { BarChart } from "layerchart";
	import * as Chart from "$lib/components/ui/chart";

	const CHARACTER = 6.4;
	const MAX_LABEL = 180;

	type Props = {
		label: string;
		data: { name: string; value: number }[];
		format: (value: number) => string;
	};

	let { label, data, format }: Props = $props();

	const config = $derived({
		value: { label, color: "var(--primary)" },
	} satisfies Chart.ChartConfig);

	const longest = $derived(
		data.reduce((max, { name }) => Math.max(max, name.length), 0),
	);

	const padding = $derived({
		top: 4,
		right: 8,
		bottom: 20,
		left: Math.min(MAX_LABEL, 16 + longest * CHARACTER),
	});
</script>

<Chart.Container {config} class="h-64 w-full">
	<BarChart
		{data}
		{padding}
		orientation="horizontal"
		y="name"
		x="value"
		rule={false}
		props={{
			bars: { stroke: "none", strokeWidth: 0, rounded: "edge", radius: 4 },
			highlight: { area: { fill: "none" } },
			xAxis: { format, ticks: 4 },
		}}
	>
		{#snippet tooltip()}
			<Chart.Tooltip hideLabel>
				{#snippet formatter({ value })}
					<span class="text-muted-foreground">{label}</span>
					<span class="ml-auto font-mono font-medium tabular-nums">
						{format(Number(value))}
					</span>
				{/snippet}
			</Chart.Tooltip>
		{/snippet}
	</BarChart>
</Chart.Container>
