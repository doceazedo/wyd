<script lang="ts">
	import { env } from "$env/dynamic/public";
	import PageTitle from "$lib/components/page-title.svelte";
</script>

<PageTitle>what you doing?</PageTitle>

<p class="mt-6 leading-7">
	<b>wyd?</b> started because I wanted to make it easy to say what you're up to without
	the additional work to regularly update it manually. It uses data from services
	you already use. Some of them either don't have a public API or require a backend
	to implement. So this is why this site exists!
</p>

<h2 class="mt-6 border-b py-1.5 text-2xl font-medium md:text-3xl">How</h2>
<p class="mt-3 leading-7">
	On your side, you can just copy a widget script or implement our API.
</p>
<p class="mt-3 leading-7">
	From our end, we either talk to the service APIs or grab the data directly
	from their website, then we cache the response (so it loads faster for the
	next visitors), and hand back something easy to work with.
</p>
<p class="mt-3 leading-7">
	The entire thing is built with SvelteKit, running on <a
		class="underline hover:opacity-80"
		href="https://doce.sh/blog/building-a-home-server"
		target="_blank">my home server</a
	>.
</p>
<p class="mt-3 leading-7">
	It's also <a
		class="underline hover:opacity-80"
		href="https://github.com/doceazedo/wyd"
		target="_blank">open-source</a
	>, so issues and pull requests are welcome. If something breaks, please tell
	me!
</p>

<h2 class="mt-6 border-b py-1.5 text-2xl font-medium md:text-3xl">Who</h2>
<p class="mt-3 leading-7">
	This website is maintained by me, <b>Doce</b> (he/they)! I'm a unicorn
	developer, designer, and DJ. You can find me at
	<a class="underline hover:opacity-80" href="http://doce.sh" target="_blank"
		>doce.sh</a
	>.
</p>
<p class="mt-3 leading-7">
	From our end, we either talk to the service APIs or grab the data directly
	from their website, then we cache the response (so it loads faster for the
	next visitors), and hand back something easy to work with.
</p>

<h2 class="mt-6 border-b py-1.5 text-2xl font-medium md:text-3xl">
	Disclaimers
</h2>
<p class="mt-3 leading-7">
	The <b>/now</b> page is idealized by
	<a
		class="underline hover:opacity-80"
		href="https://sive.rs/nowff"
		target="_blank">Derek Sivers</a
	>. Please check
	<a
		class="underline hover:opacity-80"
		href="https://nownownow.com"
		target="_blank">nownownow.com</a
	>
	and the
	<a
		class="underline hover:opacity-80"
		href="https://indieweb.org/now"
		target="_blank">IndieWeb</a
	> to know more.
</p>
<p class="mt-3 leading-7">
	We are not affiliated or endorsed in any way by the services implemented or
	mentioned on this website. All the data is publicly available, and belongs to
	them and to you.
</p>
{#if env.PUBLIC_CACHE_DURATION}
	<p class="mt-3 leading-7">
		This data may be cached for a maximum of {env.PUBLIC_CACHE_DURATION} hours, then
		discarded.
	</p>
{/if}
<p class="mt-3 leading-7">We store anonymized and aggregated usage stats.</p>
