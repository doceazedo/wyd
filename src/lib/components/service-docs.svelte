<script lang="ts">
	import ApiDocs from "$lib/components/api-docs.svelte";
	import PageTitle from "$lib/components/page-title.svelte";
	import WidgetDocs from "$lib/components/widget-docs.svelte";
	import type { Service } from "$lib/services";

	type Props = { service: Service };

	let { service }: Props = $props();
</script>

<div class="flex flex-col gap-12 pb-24">
	<PageTitle>{service.title}</PageTitle>
	<WidgetDocs {service} />
	<ApiDocs {service} />
</div>
