<script lang="ts">
	import { page } from "$app/state";
	import CodeBlock from "$lib/components/code-block.svelte";
	import DocsSection from "$lib/components/docs-section.svelte";
	import OptionsTable from "$lib/components/options-table.svelte";
	import WidgetPreview from "$lib/components/widget-preview.svelte";
	import { snippet, type Service, type WidgetValues } from "$lib/services";
	import { untrack } from "svelte";

	type Props = { service: Service };

	let { service }: Props = $props();
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
</script>

<DocsSection title="Widget">
	<CodeBlock {code} />

	<div class="min-h-72 border p-6">
		<WidgetPreview name={service.widget.name} attributes={values} />
	</div>

	<OptionsTable
		label="Attribute"
		options={service.widget.options}
		bind:values
	/>
</DocsSection>
