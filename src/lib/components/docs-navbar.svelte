<script lang="ts">
	import { resolve } from "$app/paths";
	import { Button } from "$lib/components/ui/button/index.js";
	import { useSidebar } from "$lib/components/ui/sidebar/index.js";
	import { RiMenuLine } from "remixicon-svelte";

	const sidebar = useSidebar();
</script>

<header
	class="sticky top-0 z-10 -mx-3 flex h-14 items-center gap-1.5 border-b bg-background px-3 md:hidden"
>
	<Button
		variant="ghost"
		size="icon"
		onclick={() => sidebar.setOpenMobile(true)}
	>
		<RiMenuLine />
		<span class="sr-only">Open menu</span>
	</Button>
	<a href={resolve("/")} class="text-2xl font-bold">wyd?</a>
</header>
