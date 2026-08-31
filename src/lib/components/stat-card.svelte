<script lang="ts">
	import * as Card from "$lib/components/ui/card";

	type Props = { label: string; value: string };

	let { label, value }: Props = $props();
</script>

<Card.Root>
	<Card.Content class="flex flex-col gap-1">
		<p class="text-sm opacity-80">{label}</p>
		<p class="text-3xl font-medium">{value}</p>
	</Card.Content>
</Card.Root>
