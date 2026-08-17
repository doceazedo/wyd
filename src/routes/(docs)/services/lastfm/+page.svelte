<script lang="ts">
	import DocsSection from "$lib/components/docs-section.svelte";
	import ServiceDocs from "$lib/components/service-docs.svelte";
	import { m } from "$lib/paraglide/messages.js";
	import { SERVICES, SPOTIFY_IMAGE_CACHE_DAYS } from "$lib/services";
</script>

<ServiceDocs service={SERVICES.lastfm}>
	<DocsSection title={m.docs_notes()}>
		<p class="text-foreground/80">
			{m.docs_notes_lastfm_images({ days: SPOTIFY_IMAGE_CACHE_DAYS })}
		</p>
	</DocsSection>
</ServiceDocs>
