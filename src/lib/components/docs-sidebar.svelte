<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { RiBook2Line, RiQuestionLine } from "remixicon-svelte";
	import { siLetterboxd, siSteam, siThestorygraph } from "simple-icons";

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
	];

	const SERVICES = [
		{
			title: "Letterboxd",
			url: "/",
			icon: siLetterboxd.svg,
		},
		{
			title: "Steam",
			url: "/",
			icon: siSteam.svg,
		},
		{
			title: "Storygraph",
			url: "/",
			icon: siThestorygraph.svg,
		},
	];
</script>

<Sidebar.Root>
	<Sidebar.Header>
		<Sidebar.MenuButton class="h-fit">
			{#snippet child({ props })}
				<a href="/" {...props}>
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
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a href={item.url} {...props}>
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
					{#each SERVICES as item (item.title)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a href={item.url} {...props}>
										{@html item.icon}
										<span>{item.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
</Sidebar.Root>
