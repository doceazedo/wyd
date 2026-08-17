<script lang="ts">
	import {
		attributes,
		skeleton,
		type Widget,
		type WidgetValues,
	} from "$lib/services";

	type Props = { widget: Widget; values: WidgetValues };

	let { widget, values }: Props = $props();
	let container = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (!container) return;

		const host = container;
		const entries = attributes(widget, values);
		host.innerHTML = skeleton(widget, values);

		const timer = setTimeout(() => {
			const script = document.createElement("script");
			script.src = `/widgets/${widget.name}.js`;
			script.async = true;
			entries.forEach(([attribute, value]) =>
				script.setAttribute(attribute, value),
			);
			host.insertBefore(script, host.firstChild);
		}, 600);

		return () => {
			clearTimeout(timer);
			host.replaceChildren();
		};
	});
</script>

<div bind:this={container}></div>
