import { fetchJson } from "./api";

const MISSING_USER = "set the data-user attribute to load this widget";

export const resource = <T>(url: () => string | null) => {
	let data = $state<T | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(true);

	$effect(() => {
		const target = url();
		error = null;

		if (!target) {
			data = null;
			error = MISSING_USER;
			loading = false;
			return;
		}

		let active = true;
		loading = true;

		fetchJson<T>(target)
			.then((value) => {
				if (active) data = value;
			})
			.catch((reason) => {
				if (active)
					error = reason instanceof Error ? reason.message : String(reason);
			})
			.finally(() => {
				if (active) loading = false;
			});

		return () => {
			active = false;
		};
	});

	return {
		get data() {
			return data;
		},
		get error() {
			return error;
		},
		get loading() {
			return loading;
		},
	};
};
