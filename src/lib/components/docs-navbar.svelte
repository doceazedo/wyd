<script lang="ts">
	import { resolve } from "$app/paths";
	import type { Pathname } from "$app/types";
	import { Button } from "$lib/components/ui/button/index.js";
	import { useSidebar } from "$lib/components/ui/sidebar/index.js";
	import { m } from "$lib/paraglide/messages.js";
	import { localizeHref } from "$lib/paraglide/runtime";
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
		<span class="sr-only">{m.nav_open_menu()}</span>
	</Button>
	<a href={resolve(localizeHref("/") as Pathname)} class="text-2xl font-bold"
		>wyd?</a
	>
</header>
