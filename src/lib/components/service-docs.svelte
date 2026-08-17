<script lang="ts">
	import ApiDocs from "$lib/components/api-docs.svelte";
	import PageTitle from "$lib/components/page-title.svelte";
	import WidgetDocs from "$lib/components/widget-docs.svelte";
	import type { Service } from "$lib/services";
	import type { Snippet } from "svelte";

	type Props = { service: Service; children?: Snippet };

	let { service, children }: Props = $props();
</script>

<div class="flex flex-col gap-12 pb-24">
	<hgroup class="flex flex-col gap-1.5">
		<PageTitle>{service.title}</PageTitle>
		<p class="text-foreground/80">{service.description()}</p>
	</hgroup>
	<WidgetDocs {service} />
	<ApiDocs {service} />
	{@render children?.()}
</div>
