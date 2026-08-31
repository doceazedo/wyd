<script lang="ts">
	import { enhance } from "$app/forms";
	import PageTitle from "$lib/components/page-title.svelte";
	import StatsDashboard from "$lib/components/stats-dashboard.svelte";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { m } from "$lib/paraglide/messages.js";

	let { data, form } = $props();
</script>

<PageTitle>{m.stats_title()}</PageTitle>

{#if data.stats}
	<StatsDashboard stats={data.stats} />
{:else}
	<p class="mt-1 opacity-80">{m.stats_private()}</p>

	<form method="POST" use:enhance class="mt-6 flex max-w-sm flex-col gap-3">
		<Input
			type="password"
			name="secret"
			autocomplete="current-password"
			aria-label={m.stats_secret()}
			placeholder={m.stats_secret()}
			required
		/>
		<Button type="submit" class="self-start">{m.stats_login()}</Button>
		{#if form?.invalid}
			<p class="text-sm text-destructive">{m.stats_invalid()}</p>
		{/if}
	</form>
{/if}
