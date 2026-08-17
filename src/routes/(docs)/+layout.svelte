<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import DocsSidebar from "$lib/components/docs-sidebar.svelte";
	import DocsNavbar from "$lib/components/docs-navbar.svelte";

	let { children } = $props();
</script>

<Sidebar.Provider>
	<DocsSidebar />
	<div class="flex min-w-0 flex-1 flex-col">
		<DocsNavbar />
		<main class="py-3 md:py-12">
			{@render children?.()}
		</main>
	</div>
</Sidebar.Provider>
