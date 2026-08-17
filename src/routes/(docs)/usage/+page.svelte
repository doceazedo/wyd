<script lang="ts">
	import PageTitle from "$lib/components/page-title.svelte";

	const UPDATED_AT = new Date("2026/08/17");
</script>

<PageTitle>Usage</PageTitle>

<p class="mt-1 opacity-80">
	<b class="font-medium">Updated at:</b>
	{UPDATED_AT.toLocaleDateString("en-US", {
		day: "numeric",
		month: "long",
		year: "numeric",
	})}
</p>

<h2 class="mt-6 border-b py-1.5 text-2xl font-medium md:text-3xl">
	What is this project for
</h2>
<p class="mt-3 leading-7">
	Personal sites. /now pages, sidebars, footers, about pages, and the like. If
	you're a person putting things about yourself on the internet, you're the
	intended audience.
</p>

<h2 class="mt-6 border-b py-1.5 text-2xl font-medium md:text-3xl">
	What it is not for
</h2>
<p class="mt-3 leading-7">
	Any kind of commercial usage, bulk data collection, or mirroring our responses
	as your own API.
</p>

<h2 class="mt-6 border-b py-1.5 text-2xl font-medium md:text-3xl">
	Rate limits
</h2>
<p class="mt-3 leading-7">
	The same IP can make up to 20 requests per minute. If you exceed this limit,
	your requests will be blocked for the next few minutes.
</p>

<h2 class="mt-6 border-b py-1.5 text-2xl font-medium md:text-3xl">
	Be reasonable
</h2>
<p class="mt-3 leading-7">
	We already cache the services reponses to avoid they rate limiting us and to
	provide faster responses. Please be so kind to make sure to do the same, if
	you're calling the API yourself, cache responses on your end as well.
</p>
<p class="mt-3 leading-7">
	We only fetch what is already made public by the third party services. Keep
	your links and credits pointing back at those services, and don't use this
	project to fetch other people's data.
</p>

<h2 class="mt-6 border-b py-1.5 text-2xl font-medium md:text-3xl">
	No guarantees
</h2>
<p class="mt-3 leading-7">
	Please beware this is a free project made by one person running on my home
	server. These APIs are unofficial, which means they can change or disappear
	without warning, and so can this project.
</p>
<p class="mt-3 leading-7">
	I'll do my best to keep it online. If anything seems broken, please <a
		class="underline hover:opacity-80"
		href="https://github.com/doceazedo/wyd/issues"
		target="_blank"
		rel="noopener noreferrer">open an issue</a
	>.
</p>

<h2 class="mt-6 border-b py-1.5 text-2xl font-medium md:text-3xl">Contact</h2>
<p class="mt-3 leading-7">
	If in doubt, please ask. Send an email to Doce at
	"agri[myname].fer@gmail.com".
</p>
