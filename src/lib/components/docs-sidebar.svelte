<script lang="ts">
	import type { Pathname } from "$app/types";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import { afterNavigate } from "$app/navigation";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { deLocalizeHref } from "$lib/paraglide/runtime";
	import { SERVICES } from "$lib/services";
	import { RiBook2Line, RiQuestionLine, RiListCheck3 } from "remixicon-svelte";
	import type { Component } from "svelte";
	import LanguageSwitcher from "./language-switcher.svelte";

	const ITEMS = [
		{
			title: "Getting started",
			url: "/guide",
			icon: RiBook2Line,
		},
		{
			title: "About",
			url: "/about",
			icon: RiQuestionLine,
		},
		{
			title: "Usage",
			url: "/usage",
			icon: RiListCheck3,
		},
	] satisfies { title: string; url: Pathname; icon: Component }[];

	const sidebar = Sidebar.useSidebar();
	const services = Object.values(SERVICES);
	const pathname = $derived(deLocalizeHref(page.url.pathname));
	const isActive = (url: string) => pathname === url;

	afterNavigate(() => sidebar.setOpenMobile(false));
</script>

<Sidebar.Root>
	<Sidebar.Header>
		<Sidebar.MenuButton class="h-fit">
			{#snippet child({ props })}
				<a href={resolve("/")} {...props}>
					<span class="text-2xl font-bold">wyd?</span>
				</a>
			{/snippet}
		</Sidebar.MenuButton>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each ITEMS as item (item.title)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton isActive={isActive(item.url)}>
								{#snippet child({ props })}
									<a href={resolve(item.url)} {...props}>
										<item.icon />
										<span>{item.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
		<Sidebar.Group>
			<Sidebar.GroupLabel>Services</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each services as service (service.name)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								isActive={isActive(`/services/${service.name}`)}
							>
								{#snippet child({ props })}
									<a
										href={resolve(`/services/${service.name}` as Pathname)}
										{...props}
									>
										{@html service.icon}
										<span>{service.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<LanguageSwitcher />
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
