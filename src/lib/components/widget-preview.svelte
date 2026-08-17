<script lang="ts">
	import { skeleton, type WidgetValues } from "$lib/services";

	type Props = { name: string; attributes: WidgetValues };

	let { name, attributes }: Props = $props();
	let container = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (!container) return;

		const host = container;
		const entries = Object.entries(attributes).filter(([, value]) => !!value);
		host.innerHTML = skeleton(attributes);

		const timer = setTimeout(() => {
			const script = document.createElement("script");
			script.src = `/widgets/${name}.js`;
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
