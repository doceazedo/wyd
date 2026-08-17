<script lang="ts">
	import { resolve } from "$app/paths";
	import type { Pathname } from "$app/types";
	import { localizeHref } from "$lib/paraglide/runtime";
</script>

<a href={resolve(localizeHref("/demo/paraglide") as Pathname)}>paraglide</a>
