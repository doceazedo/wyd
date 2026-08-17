<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import WidgetPreview from "$lib/components/widget-preview.svelte";
	import {
		maxValue,
		snippet,
		type Service,
		type WidgetOption,
		type WidgetValues,
	} from "$lib/services";
	import { RiCheckLine, RiFileCopyLine } from "remixicon-svelte";
	import { untrack } from "svelte";

	type Props = { service: Service };

	let { service }: Props = $props();
	let copied = $state(false);
	let values = $state<WidgetValues>(
		untrack(() =>
			Object.fromEntries(
				service.widget.options.map((option) => [
					option.attribute,
					option.value,
				]),
			),
		),
	);

	const code = $derived(snippet(service.widget, values, page.url.origin));

	$effect(() => {
		service.widget.options.forEach((option) => {
			const max = maxValue(option, values);
			if (max !== null && Number(values[option.attribute]) > max)
				values[option.attribute] = `${max}`;
		});
	});

	const clamp = (option: WidgetOption) => {
		const max = maxValue(option, values);
		const value = Number(values[option.attribute]);
		if (!value) values[option.attribute] = option.value;
		else if (option.min !== undefined && value < option.min)
			values[option.attribute] = `${option.min}`;
		else if (max !== null && value > max) values[option.attribute] = `${max}`;
	};

	const copy = async () => {
		await navigator.clipboard.writeText(code);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	};
</script>

<section class="flex flex-col gap-4">
	<hgroup>
		<h2 class="text-2xl font-medium md:text-3xl">Widget</h2>
	</hgroup>

	<div class="flex items-start gap-3 border bg-muted p-3">
		<pre class="w-full min-w-0 overflow-x-auto py-1.5 text-sm"><code
				>{code}</code
			></pre>
		<Button onclick={copy}>
			{#if copied}
				<RiCheckLine />
				Copied!
			{:else}
				<RiFileCopyLine />
				Copy
			{/if}
		</Button>
	</div>

	<div class="min-h-72 border p-6">
		<WidgetPreview name={service.widget.name} attributes={values} />
	</div>

	<div class="overflow-x-auto">
		<table class="w-full text-left text-sm">
			<thead class="border-b">
				<tr>
					<th class="py-2 font-medium">Attribute</th>
					<th class="py-2 font-medium">Description</th>
					<th class="py-2 font-medium">Value</th>
				</tr>
			</thead>
			<tbody>
				{#each service.widget.options as option (option.attribute)}
					<tr class="border-b">
						<td class="py-2 pr-3 font-mono">{option.attribute}</td>
						<td class="py-2 pr-3 opacity-80">{option.description}</td>
						<td class="w-44 py-2">
							{#if option.values}
								<select
									class="h-8 w-full border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
									aria-label={option.attribute}
									bind:value={values[option.attribute]}
								>
									{#each option.values as choice (choice)}
										<option value={choice}>{choice}</option>
									{/each}
								</select>
							{:else if option.min !== undefined}
								<Input
									type="number"
									aria-label={option.attribute}
									min={option.min}
									max={maxValue(option, values)}
									bind:value={values[option.attribute]}
									onblur={() => clamp(option)}
								/>
							{:else}
								<Input
									type="text"
									aria-label={option.attribute}
									bind:value={values[option.attribute]}
								/>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
