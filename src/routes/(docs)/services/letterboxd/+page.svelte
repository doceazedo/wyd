<script lang="ts">
	import PageTitle from "$lib/components/page-title.svelte";
	import WidgetDocs from "$lib/components/widget-docs.svelte";
	import { SERVICES } from "$lib/services";

	const service = SERVICES.letterboxd;
</script>

<div class="flex flex-col gap-12 pb-24">
	<PageTitle>{service.title}</PageTitle>
	<WidgetDocs {service} />
</div>
