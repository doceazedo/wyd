<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as Card from "$lib/components/ui/card";
	import { siLetterboxd, siSteam, siThestorygraph } from "simple-icons";

	const SERVICES = [
		{
			icon: siLetterboxd.svg,
			name: "Letterboxd",
			description: "Grab your favorite and recently watched movies.",
		},
		{
			icon: siSteam.svg,
			name: "Steam",
			description: "Grab your recently played games.",
		},
		{
			icon: siThestorygraph.svg,
			name: "Storygraph",
			description:
				"Grab your currently reading books, recently read, and to-read.",
		},
	];
</script>

<header class="flex flex-col gap-6 py-24">
	<hgroup>
		<h1 class="mb-1 text-5xl font-extrabold lg:text-6xl">wyd?</h1>
		<p class="text-lg">
			Public collection of your online activity for your <a
				class="underline hover:opacity-80"
				href="https://indieweb.org/now"
				target="_blank"
				rel="noopener noreferrer">/now</a
			> page.
		</p>
	</hgroup>
	<div class="flex gap-1.5">
		<Button href="/guide" size="lg">Getting started</Button>
		<Button href="/about" size="lg" variant="ghost">What is that?</Button>
	</div>
</header>

<div class="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6">
	{#each SERVICES as service, i (i)}
		<Card.Root>
			<Card.Content class="flex flex-col gap-3">
				<i
					class="flex size-10 items-center justify-center bg-muted [&>svg]:size-6 [&>svg]:fill-muted-foreground"
				>
					{@html service.icon}
				</i>
				<p class="text-base font-medium">{service.name}</p>
				<p class="opacity-80">{service.description}</p>
			</Card.Content>
		</Card.Root>
	{/each}
</div>
