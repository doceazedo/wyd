<script lang="ts">
	import { RiStarFill, RiStarHalfFill } from "remixicon-svelte";
	import type { Item } from "./types";

	type Props = {
		items: Item[];
		loading: boolean;
		error: string | null;
		count: number;
		empty: string;
		labels?: boolean;
		ratio?: string;
	};

	let {
		items,
		loading,
		error,
		count,
		empty,
		labels = true,
		ratio = "2 / 3",
	}: Props = $props();

	const placeholders = $derived(
		Array.from({ length: count }, (_, index) => index),
	);

	const stars = (rating: number) =>
		Array.from({ length: Math.floor(rating) }, (_, index) => index);
</script>

<div class="grid" style="--wyd-columns: {count}; --wyd-ratio: {ratio};">
	{#if loading}
		{#each placeholders as placeholder (placeholder)}
			<div class="cell">
				<div class="cover pulse"></div>
				{#if labels}
					<div class="lines">
						<div class="line pulse"></div>
						<div class="line short pulse"></div>
					</div>
				{/if}
			</div>
		{/each}
	{:else if error}
		<p class="notice">{error}</p>
	{:else if !items.length}
		<p class="notice">{empty}</p>
	{:else}
		{#each items as item (item.id)}
			<a class="cell" href={item.url} target="_blank" rel="noopener noreferrer">
				<div class="cover">
					{#if item.image}
						<img src={item.image} alt={item.title} loading="lazy" />
					{:else}
						<span class="fallback">{item.title}</span>
					{/if}
				</div>
				{#if labels}
					<div class="lines">
						<span class="title">{item.title}</span>
						{#if item.rating}
							<span class="rating">
								{#each stars(item.rating) as star (star)}
									<RiStarFill />
								{/each}
								{#if item.rating % 1}
									<RiStarHalfFill />
								{/if}
							</span>
						{:else if item.subtitle}
							<span class="subtitle">{item.subtitle}</span>
						{/if}
					</div>
				{/if}
			</a>
		{/each}
	{/if}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(var(--wyd-columns), minmax(0, 1fr));
		gap: 0.75rem;
		font-size: 0.8125rem;
		line-height: 1.35;
	}

	@container (max-width: 32rem) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@container (max-width: 20rem) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.cell {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 0;
		color: inherit;
		text-decoration: none;
	}

	.cover {
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: var(--wyd-ratio);
		overflow: hidden;
		background-color: color-mix(in srgb, currentColor 10%, transparent);
		transition: opacity 150ms ease;
	}

	a.cell:hover .cover {
		opacity: 0.75;
	}

	.cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.fallback {
		padding: 0.5rem;
		text-align: center;
		opacity: 0.6;
	}

	.lines {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.title,
	.subtitle {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.title {
		font-weight: 500;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	.subtitle {
		font-size: 0.75rem;
		opacity: 0.7;
		-webkit-line-clamp: 1;
		line-clamp: 1;
	}

	.rating {
		display: flex;
		opacity: 0.7;
	}

	.rating :global(svg) {
		width: 0.6875rem;
		height: 0.6875rem;
	}

	.line {
		height: 0.6875rem;
		background-color: color-mix(in srgb, currentColor 10%, transparent);
	}

	.line.short {
		width: 60%;
	}

	.notice {
		grid-column: 1 / -1;
		margin: 0;
		opacity: 0.7;
	}

	.pulse {
		animation: pulse 1.6s ease-in-out infinite;
	}

	@keyframes pulse {
		50% {
			opacity: 0.4;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pulse {
			animation: none;
		}
	}
</style>
