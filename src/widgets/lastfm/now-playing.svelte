<script lang="ts">
	type Props = {
		title: string | null;
		subtitle: string | null;
		image: string | null;
		url: string | null;
		live: boolean;
		label: string;
		loading: boolean;
		error: string | null;
		empty: string;
	};

	let {
		title,
		subtitle,
		image,
		url,
		live,
		label,
		loading,
		error,
		empty,
	}: Props = $props();
</script>

{#if loading}
	<div class="now">
		<div class="cover pulse"></div>
		<div class="lines">
			<div class="line pulse"></div>
			<div class="line short pulse"></div>
		</div>
	</div>
{:else if error}
	<p class="notice">{error}</p>
{:else if !title}
	<p class="notice">{empty}</p>
{:else}
	<a class="now" href={url} target="_blank" rel="noopener noreferrer">
		<div class="cover">
			{#if image}
				<img src={image} alt={title} loading="lazy" />
			{:else}
				<span class="fallback">{title}</span>
			{/if}
			{#if live}
				<span class="live" role="img" aria-label={label}></span>
			{/if}
		</div>
		<div class="lines">
			<span class="title">{title}</span>
			{#if subtitle}
				<span class="subtitle">{subtitle}</span>
			{/if}
		</div>
	</a>
{/if}

<style>
	.now {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
		color: inherit;
		text-decoration: none;
		font-size: 0.875rem;
		line-height: 1.35;
	}

	.cover {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 4rem;
		aspect-ratio: 1 / 1;
		overflow: visible;
		background-color: color-mix(in srgb, currentColor 10%, transparent);
		transition: opacity 150ms ease;
	}

	a.now:hover .cover {
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
		font-size: 0.75rem;
		text-align: center;
		opacity: 0.6;
	}

	.live {
		position: absolute;
		top: -0.25rem;
		right: -0.25rem;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background-color: #d51007;
		box-shadow: 0 0 0 0.125rem color-mix(in srgb, #000 25%, transparent);
	}

	.live::after {
		content: "";
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background-color: inherit;
		animation: ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
	}

	.lines {
		display: flex;
		flex-direction: column;
		flex: 1;
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
		font-size: 0.8125rem;
		opacity: 0.7;
		-webkit-line-clamp: 1;
		line-clamp: 1;
	}

	.line {
		width: 12rem;
		max-width: 100%;
		height: 0.6875rem;
		background-color: color-mix(in srgb, currentColor 10%, transparent);
	}

	.line + .line {
		margin-top: 0.5rem;
	}

	.line.short {
		width: 7rem;
	}

	.notice {
		margin: 0;
		opacity: 0.7;
		font-size: 0.875rem;
	}

	.pulse {
		animation: pulse 1.6s ease-in-out infinite;
	}

	@keyframes pulse {
		50% {
			opacity: 0.4;
		}
	}

	@keyframes ping {
		75%,
		100% {
			transform: scale(2.4);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pulse,
		.live::after {
			animation: none;
		}
	}
</style>
