<script lang="ts">
	import { resolve } from "$app/paths";
	import type { Pathname } from "$app/types";
	import { Button } from "$lib/components/ui/button";
	import * as Card from "$lib/components/ui/card";
	import { SERVICES } from "$lib/services";

	const services = Object.values(SERVICES);
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
	{#each services as service (service.name)}
		<a
			class="transition-all hover:-translate-y-1"
			href={resolve(`/services/${service.name}` as Pathname)}
		>
			<Card.Root class="h-full transition-all hover:ring-primary">
				<Card.Content class="flex flex-col gap-3">
					<i
						class="flex size-10 items-center justify-center bg-muted [&>svg]:size-6 [&>svg]:fill-muted-foreground"
					>
						{@html service.icon}
					</i>
					<p class="text-base font-medium">{service.title}</p>
					<p class="opacity-80">{service.description}</p>
				</Card.Content>
			</Card.Root>
		</a>
	{/each}
</div>
