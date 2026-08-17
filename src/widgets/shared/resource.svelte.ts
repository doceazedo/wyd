import { fetchJson } from "./api";

const MISSING_USER = "set the data-user attribute to load this widget";

export const resource = <T>(url: () => string | null) => {
	let data = $state<T | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(true);
	let request = 0;

	const load = (target: string | null, quiet = false) => {
		const id = ++request;

		if (!target) {
			data = null;
			error = MISSING_USER;
			loading = false;
			return;
		}

		if (!quiet) {
			error = null;
			loading = true;
		}

		fetchJson<T>(target)
			.then((value) => {
				if (id !== request) return;

				data = value;
				error = null;
			})
			.catch((reason) => {
				if (id !== request || quiet) return;

				error = reason instanceof Error ? reason.message : String(reason);
			})
			.finally(() => {
				if (id === request) loading = false;
			});
	};

	$effect(() => {
		load(url());
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
		reload: () => load(url(), true),
	};
};
