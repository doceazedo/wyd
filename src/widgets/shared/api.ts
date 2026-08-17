export const endpoint = (api: string, path: string) =>
	`${api.endsWith("/") ? api.slice(0, -1) : api}${path}`;

const failure = (body: unknown, status: number) => {
	if (
		body &&
		typeof body === "object" &&
		"message" in body &&
		typeof body.message === "string"
	)
		return body.message;

	return `the request failed with HTTP ${status}`;
};

export const fetchJson = async <T>(url: string): Promise<T> => {
	const response = await fetch(url, {
		headers: { Accept: "application/json" },
	});
	const body = await response.json().catch(() => null);
	if (!response.ok) throw new Error(failure(body, response.status));

	return body as T;
};
