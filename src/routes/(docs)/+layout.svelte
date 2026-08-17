<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import DocsSidebar from "$lib/components/docs-sidebar.svelte";

	let { children } = $props();
</script>

<Sidebar.Provider>
	<DocsSidebar />
	<main class="min-w-0 flex-1 md:py-12">
		{@render children?.()}
	</main>
</Sidebar.Provider>
