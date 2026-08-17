import { env } from "$env/dynamic/private";
import { Session } from "impers";
import { parse, type HTMLElement } from "node-html-parser";

export const BASE_URL = "https://app.thestorygraph.com";

const SESSION_TTL = 6 * 60 * 60 * 1000;

export type Book = {
	id: string;
	title: string;
	author: string | null;
	cover: string | null;
	url: string;
};

type Cookies = Record<string, string>;

export class StorygraphError extends Error {
	status: number;

	constructor(message: string, status = 502) {
		super(message);
		this.name = "StorygraphError";
		this.status = status;
	}
}

let cached: { cookies: Cookies; expiresAt: number } | null = null;
let signingIn: Promise<Cookies> | null = null;

const withSession = async <T>(
	cookies: Cookies,
	use: (session: Session) => Promise<T>,
): Promise<T> => {
	const session = new Session({
		baseUrl: BASE_URL,
		impersonate: "chrome",
		cookies,
		timeout: 30,
	});
	try {
		return await use(session);
	} finally {
		await session.close();
	}
};

const signIn = async (): Promise<Cookies> => {
	const { STORYGRAPH_USERNAME, STORYGRAPH_PASSWORD } = env;
	if (!STORYGRAPH_USERNAME || !STORYGRAPH_PASSWORD)
		throw new StorygraphError(
			"STORYGRAPH_USERNAME and STORYGRAPH_PASSWORD must be set in the environment",
			500,
		);

	return withSession({}, async (session) => {
		const form = await session.get("/users/sign_in");
		const token = parse(form.text)
			.querySelector('input[name="authenticity_token"]')
			?.getAttribute("value");
		if (!token)
			throw new StorygraphError(
				`could not read the sign in form (HTTP ${form.status})`,
			);

		const res = await session.post("/users/sign_in", {
			data: {
				authenticity_token: token,
				"user[email]": STORYGRAPH_USERNAME,
				"user[password]": STORYGRAPH_PASSWORD,
				"user[remember_me]": "1",
			},
			headers: { Referer: `${BASE_URL}/users/sign_in` },
		});
		if (!session.cookies.has("remember_user_token"))
			throw new StorygraphError(`sign in was rejected (HTTP ${res.status})`);

		return session.cookies.toObject();
	});
};

const getCookies = async (refresh: boolean): Promise<Cookies> => {
	if (refresh) cached = null;
	if (cached && cached.expiresAt > Date.now()) return cached.cookies;

	signingIn ||= signIn()
		.then((cookies) => {
			cached = { cookies, expiresAt: Date.now() + SESSION_TTL };
			return cookies;
		})
		.finally(() => {
			signingIn = null;
		});

	return signingIn;
};

const requestPage = async (
	path: string,
	missing: string,
	refresh: boolean,
): Promise<string | null> =>
	withSession(await getCookies(refresh), async (session) => {
		const res = await session.get(path);
		if (res.status === 404) throw new StorygraphError(missing, 404);
		if (res.status !== 200)
			throw new StorygraphError(
				`The StoryGraph responded with HTTP ${res.status} for ${path}`,
			);

		return res.text.includes('id="cu_id"') ? res.text : null;
	});

export const clean = (value: string | undefined | null) => {
	const WHITESPACE = ["\n", "\r", "\t"];
	const flattened = WHITESPACE.reduce(
		(text, char) => text.split(char).join(" "),
		value || "",
	);
	return flattened.split(" ").filter(Boolean).join(" ");
};

export const fetchPage = async (
	path: string,
	missing: string,
): Promise<HTMLElement> => {
	const html =
		(await requestPage(path, missing, false)) ||
		(await requestPage(path, missing, true));
	if (!html)
		throw new StorygraphError("could not stay signed in to The StoryGraph");

	const root = parse(html);
	if (clean(root.querySelector("title")?.text).startsWith("Not Found"))
		throw new StorygraphError(missing, 404);

	return root;
};

export const toNumber = (value: string | undefined | null) => {
	const digits = [...(value || "")]
		.filter((char) => char >= "0" && char <= "9")
		.join("");
	return digits ? Number(digits) : null;
};

const isDigits = (text: string) =>
	text.length > 0 &&
	[...text].every((char) => (char >= "0" && char <= "9") || char === ",");

export const toCount = (value: string) => {
	const text = clean(value);
	const open = text.lastIndexOf("(");
	if (open !== -1 && text.endsWith(")"))
		return toNumber(text.slice(open + 1, -1));

	return isDigits(text) ? toNumber(text) : null;
};

export const pathSegments = (href: string | undefined | null) => {
	const path = clean(href);
	if (!path.startsWith("/") || path.includes("?") || path.includes("#"))
		return [];

	return path.slice(1).split("/");
};

export const ancestors = (
	node: HTMLElement | null,
	depth: number,
): HTMLElement[] =>
	!node || depth === 0 ? [] : [node, ...ancestors(node.parentNode, depth - 1)];

export const profileUrl = (username: string) =>
	`${BASE_URL}/profile/${username}`;

export const username = (root: HTMLElement) => {
	const handle = root
		.querySelector("#profile-heading-pane")
		?.querySelectorAll("div")
		.map((div) => clean(div.text))
		.find(
			(text) => text.length > 1 && text.startsWith("@") && !text.includes(" "),
		);

	return handle ? handle.slice(1) : null;
};

export const toBook = (link: HTMLElement): Book | null => {
	const [segment, id, ...rest] = pathSegments(link.getAttribute("href"));
	if (segment !== "books" || !id || rest.length) return null;

	const image = link.querySelector("img");
	const alt = clean(image?.getAttribute("alt"));
	const by = alt.lastIndexOf(" by ");

	return {
		id,
		title: by === -1 ? alt : alt.slice(0, by),
		author: by === -1 ? null : alt.slice(by + 4),
		cover: image?.getAttribute("src") || null,
		url: `${BASE_URL}/books/${id}`,
	};
};
