<script lang="ts">
	import { resolve } from "$app/paths";
	import ApiEndpoint from "$lib/components/api-endpoint.svelte";
	import DocsSection from "$lib/components/docs-section.svelte";
	import { endpoints, type Service } from "$lib/services";

	type Props = { service: Service };

	let { service }: Props = $props();
</script>

<DocsSection title="API">
	<div class="flex flex-col gap-10">
		{#each endpoints(service) as endpoint (endpoint.path)}
			<ApiEndpoint {service} {endpoint} />
		{/each}
	</div>
</DocsSection>
