<script lang="ts">
	import * as Select from "$lib/components/ui/select/index.js";
	import { m } from "$lib/paraglide/messages.js";
	import { setLocale, getLocale, type Locale } from "$lib/paraglide/runtime";
	import { onMount } from "svelte";

	const options = [
		{ value: "en", label: "English" },
		{ value: "pt", label: "Português" },
	];

	let value = $state("en" as Locale);

	const triggerContent = $derived(
		options.find((f) => f.value === value)?.label || "",
	);

	onMount(() => {
		value = getLocale();
	});
</script>

<Select.Root
	type="single"
	name="locale"
	bind:value
	onValueChange={() => value !== getLocale() && setLocale(value)}
>
	<Select.Trigger class="w-full">
		{triggerContent}
	</Select.Trigger>
	<Select.Content>
		<Select.Group>
			<Select.Label>{m.language_label()}</Select.Label>
			{#each options as option (option.value)}
				<Select.Item value={option.value} label={option.label}>
					{option.label}
				</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
