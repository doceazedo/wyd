<script lang="ts">
	import { env } from "$env/dynamic/public";
	import PageTitle from "$lib/components/page-title.svelte";
	import { m } from "$lib/paraglide/messages.js";
</script>

<PageTitle>{m.about_title()}</PageTitle>

<p class="mt-6 leading-7"><b>wyd?</b>{m.about_intro()}</p>

<h2 class="mt-6 border-b py-1.5 text-2xl font-medium md:text-3xl">
	{m.about_how_title()}
</h2>
<p class="mt-3 leading-7">{m.about_how_1()}</p>
<p class="mt-3 leading-7">{m.about_how_2()}</p>
<p class="mt-3 leading-7">
	{m.about_how_3_start()}<a
		class="underline hover:opacity-80"
		href="https://doce.sh/blog/building-a-home-server"
		target="_blank">{m.about_how_3_link()}</a
	>{m.about_how_3_end()}
</p>
<p class="mt-3 leading-7">
	{m.about_how_4_start()}<a
		class="underline hover:opacity-80"
		href="https://github.com/doceazedo/wyd"
		target="_blank">{m.about_how_4_link()}</a
	>{m.about_how_4_end()}
</p>

<h2 class="mt-6 border-b py-1.5 text-2xl font-medium md:text-3xl">
	{m.about_who_title()}
</h2>
<p class="mt-3 leading-7">
	{m.about_who_start()}<b>Doce</b>{m.about_who_middle()}<a
		class="underline hover:opacity-80"
		href="http://doce.sh"
		target="_blank">doce.sh</a
	>{m.about_who_end()}
</p>

<h2 class="mt-6 border-b py-1.5 text-2xl font-medium md:text-3xl">
	{m.about_disclaimers_title()}
</h2>
<p class="mt-3 leading-7">
	{m.about_disclaimers_now_start()}<b>/now</b>{m.about_disclaimers_now_1()}<a
		class="underline hover:opacity-80"
		href="https://sive.rs/nowff"
		target="_blank">Derek Sivers</a
	>{m.about_disclaimers_now_2()}<a
		class="underline hover:opacity-80"
		href="https://nownownow.com"
		target="_blank">nownownow.com</a
	>{m.about_disclaimers_now_3()}<a
		class="underline hover:opacity-80"
		href="https://indieweb.org/now"
		target="_blank">IndieWeb</a
	>{m.about_disclaimers_now_end()}
</p>
<p class="mt-3 leading-7">{m.about_disclaimers_affiliation()}</p>
{#if env.PUBLIC_CACHE_DURATION}
	<p class="mt-3 leading-7">
		{m.about_disclaimers_cache({ hours: env.PUBLIC_CACHE_DURATION })}
	</p>
{/if}
<p class="mt-3 leading-7">{m.about_disclaimers_stats()}</p>
