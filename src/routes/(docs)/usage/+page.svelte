<script lang="ts">
	import PageTitle from "$lib/components/page-title.svelte";
	import { m } from "$lib/paraglide/messages.js";
	import { getLocale } from "$lib/paraglide/runtime";

	const UPDATED_AT = new Date("2026/08/17");

	const updatedAt = $derived(
		UPDATED_AT.toLocaleDateString(getLocale(), {
			day: "numeric",
			month: "long",
			year: "numeric",
		}),
	);
</script>

<PageTitle>{m.usage_title()}</PageTitle>

<p class="mt-1 opacity-80">
	<b class="font-medium">{m.usage_updated_at()}</b>
	{updatedAt}
</p>

<h2 class="mt-6 border-b py-1.5 text-2xl font-medium md:text-3xl">
	{m.usage_purpose_title()}
</h2>
<p class="mt-3 leading-7">{m.usage_purpose_body()}</p>

<h2 class="mt-6 border-b py-1.5 text-2xl font-medium md:text-3xl">
	{m.usage_not_for_title()}
</h2>
<p class="mt-3 leading-7">{m.usage_not_for_body()}</p>

<h2 class="mt-6 border-b py-1.5 text-2xl font-medium md:text-3xl">
	{m.usage_rate_limits_title()}
</h2>
<p class="mt-3 leading-7">{m.usage_rate_limits_body()}</p>

<h2 class="mt-6 border-b py-1.5 text-2xl font-medium md:text-3xl">
	{m.usage_reasonable_title()}
</h2>
<p class="mt-3 leading-7">{m.usage_reasonable_body_1()}</p>
<p class="mt-3 leading-7">{m.usage_reasonable_body_2()}</p>

<h2 class="mt-6 border-b py-1.5 text-2xl font-medium md:text-3xl">
	{m.usage_no_guarantees_title()}
</h2>
<p class="mt-3 leading-7">{m.usage_no_guarantees_body_1()}</p>
<p class="mt-3 leading-7">
	{m.usage_no_guarantees_body_2_start()}<a
		class="underline hover:opacity-80"
		href="https://github.com/doceazedo/wyd/issues"
		target="_blank"
		rel="noopener noreferrer">{m.usage_no_guarantees_link()}</a
	>{m.usage_no_guarantees_body_2_end()}
</p>

<h2 class="mt-6 border-b py-1.5 text-2xl font-medium md:text-3xl">
	{m.usage_contact_title()}
</h2>
<p class="mt-3 leading-7">{m.usage_contact_body()}</p>
