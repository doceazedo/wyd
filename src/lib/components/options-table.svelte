<script lang="ts">
	import { Input } from "$lib/components/ui/input";
	import { m } from "$lib/paraglide/messages.js";
	import {
		isEnabled,
		maxValue,
		type WidgetOption,
		type WidgetValues,
	} from "$lib/services";

	type Props = {
		label: string;
		options: WidgetOption[];
		values: WidgetValues;
	};

	let { label, options, values = $bindable() }: Props = $props();

	$effect(() => {
		options.forEach((option) => {
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
</script>

<div class="overflow-x-auto">
	<table class="w-full text-left text-sm">
		<thead class="border-b">
			<tr>
				<th class="py-2 font-medium">{label}</th>
				<th class="py-2 font-medium">{m.docs_description()}</th>
				<th class="py-2 font-medium">{m.docs_value()}</th>
			</tr>
		</thead>
		<tbody>
			{#each options as option (option.attribute)}
				{@const enabled = isEnabled(option, values)}
				<tr class="border-b" class:opacity-50={!enabled}>
					<td class="py-2 pr-3 font-mono">{option.attribute}</td>
					<td class="py-2 pr-3 opacity-80">{option.description()}</td>
					<td class="w-44 py-2">
						{#if option.values}
							<select
								class="h-8 w-full border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed dark:bg-input/30"
								aria-label={option.attribute}
								disabled={!enabled}
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
								disabled={!enabled}
								bind:value={values[option.attribute]}
								onblur={() => clamp(option)}
							/>
						{:else}
							<Input
								type="text"
								aria-label={option.attribute}
								disabled={!enabled}
								bind:value={values[option.attribute]}
							/>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
