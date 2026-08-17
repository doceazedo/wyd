<script lang="ts">
	import { page } from "$app/state";
	import CodeBlock from "$lib/components/code-block.svelte";
	import DocsSection from "$lib/components/docs-section.svelte";
	import OptionsTable from "$lib/components/options-table.svelte";
	import WidgetPreview from "$lib/components/widget-preview.svelte";
	import { m } from "$lib/paraglide/messages.js";
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

<DocsSection title={m.docs_widget()}>
	<CodeBlock {code} />

	<div class="min-h-48 border p-6">
		<WidgetPreview widget={service.widget} {values} />
	</div>

	<OptionsTable
		label={m.docs_attribute()}
		options={service.widget.options}
		bind:values
	/>
</DocsSection>
