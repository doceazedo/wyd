import { error, json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { Session } from "impers";
import { parse, type HTMLElement } from "node-html-parser";
import type { RequestHandler } from "./$types";

const BASE_URL = "https://app.thestorygraph.com";

const SECTIONS = {
	"currently-reading": "currentlyReading",
	"books-read": "read",
	"to-read": "toRead",
	five_star_reads: "fiveStarReads",
	"owned-books": "owned",
	"books-dnf": "didNotFinish",
	user_reviews: "reviews",
} as const;

type SectionSlug = keyof typeof SECTIONS;
type SectionKey = (typeof SECTIONS)[SectionSlug];

type Book = {
	id: string;
	title: string;
	author: string | null;
	cover: string | null;
	url: string;
};

type Cookies = Record<string, string>;

class StorygraphError extends Error {
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
	if (!STORYGRAPH_USERNAME || !STORYGRAPH_PASSWORD) {
		throw new StorygraphError(
			"STORYGRAPH_USERNAME and STORYGRAPH_PASSWORD must be set in the environment",
			500,
		);
	}

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

		if (!session.cookies.has("remember_user_token")) {
			throw new StorygraphError(`sign in was rejected (HTTP ${res.status})`);
		}

		return session.cookies.toObject();
	});
};

const getCookies = async (refresh = false): Promise<Cookies> => {
	if (refresh) cached = null;
	if (cached && cached.expiresAt > Date.now()) return cached.cookies;

	signingIn ||= signIn()
		.then((cookies) => {
			cached = { cookies, expiresAt: Date.now() + 6 * 60 * 60 * 1000 };
			return cookies;
		})
		.finally(() => {
			signingIn = null;
		});

	return signingIn;
};

const requestProfile = async (
	path: string,
	refresh: boolean,
): Promise<string | null> =>
	withSession(await getCookies(refresh), async (session) => {
		const resp = await session.get(path);
		if (resp.status !== 200) {
			throw new StorygraphError(
				`The StoryGraph responded with HTTP ${resp.status} for ${path}`,
			);
		}
		const isSignedIn = resp.text.includes('id="cu_id"');
		return isSignedIn ? resp.text : null;
	});

const fetchProfile = async (user: string): Promise<string> => {
	const path = `/profile/${encodeURIComponent(user)}`;
	const html =
		(await requestProfile(path, false)) || (await requestProfile(path, true));
	if (!html)
		throw new StorygraphError("could not stay signed in to The StoryGraph");

	return html;
};

const clean = (value: string | undefined | null) => {
	const WHITESPACE = ["\n", "\r", "\t"];
	const flattened = WHITESPACE.reduce(
		(text, char) => text.split(char).join(" "),
		value || "",
	);
	return flattened.split(" ").filter(Boolean).join(" ");
};

const isDigits = (text: string) =>
	text.length > 0 &&
	[...text].every((char) => (char >= "0" && char <= "9") || char === ",");

const toNumber = (value: string | undefined | null) => {
	const digits = [...(value || "")]
		.filter((char) => char >= "0" && char <= "9")
		.join("");
	return digits ? Number(digits) : null;
};

const toCount = (value: string) => {
	const text = clean(value);
	const open = text.lastIndexOf("(");
	if (open !== -1 && text.endsWith(")"))
		return toNumber(text.slice(open + 1, -1));
	return isDigits(text) ? toNumber(text) : null;
};

const pathSegments = (href: string | undefined | null) => {
	const path = clean(href);
	if (!path.startsWith("/") || path.includes("?") || path.includes("#"))
		return [];
	return path.slice(1).split("/");
};

const sectionSlug = (
	href: string | undefined | null,
	username: string,
): SectionSlug | null => {
	const [slug, user, ...rest] = pathSegments(href);
	if (!slug || !user || rest.length) return null;
	if (!(slug in SECTIONS)) return null;
	if (decodeURIComponent(user).toLowerCase() !== username.toLowerCase())
		return null;

	return slug as SectionSlug;
};

const toBook = (link: HTMLElement): Book | null => {
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

const ancestors = (node: HTMLElement | null, depth: number): HTMLElement[] =>
	!node || depth === 0 ? [] : [node, ...ancestors(node.parentNode, depth - 1)];

const sectionBooks = (anchor: HTMLElement, username: string) =>
	ancestors(anchor.parentNode, 3)
		.filter(
			(node) =>
				new Set(
					node
						.querySelectorAll("a[href]")
						.map((link) => sectionSlug(link.getAttribute("href"), username))
						.filter(Boolean),
				).size <= 1,
		)
		.map((node) => node.querySelectorAll("a.book-page-link"))
		.find((links) => links.length) || [];

const parseTaste = (spans: HTMLElement[]) => {
	const values = (prefix: string) => {
		const span = spans.find((candidate) =>
			clean(candidate.text).startsWith(prefix),
		);
		return span
			? span.querySelectorAll("span").map((value) => clean(value.text))
			: [];
	};

	const [genre, ...moods] = values("Mainly reads");
	const [pace, length] = values("Typically chooses");
	if (!genre && !pace) return null;

	return {
		genre: genre || null,
		moods,
		pace: pace || null,
		length: length || null,
	};
};

const parseGoal = (root: HTMLElement) => {
	const heading = root
		.querySelectorAll("h1")
		.find((h1) => clean(h1.text).endsWith("Reading Goals"));
	const pane = heading?.parentNode;
	if (!heading || !pane) return null;

	const progress = pane
		.querySelectorAll("p")
		.map((paragraph) => clean(paragraph.text))
		.find((text) => text.includes("/") && text.endsWith("books"));
	const [read, target] = (progress || "").split("/");
	const percent = pane
		.querySelectorAll("span")
		.map((span) => clean(span.text))
		.find((text) => text.endsWith("%"));

	return {
		year: toNumber(clean(heading.text).split(" ")[0]),
		read: toNumber(read),
		target: toNumber(target),
		percent: toNumber(percent),
	};
};

const parseProfile = (root: HTMLElement, requested: string) => {
	const pane = root.querySelector("#profile-heading-pane");
	const handle = pane
		?.querySelectorAll("div")
		.map((div) => clean(div.text))
		.find(
			(text) => text.length > 1 && text.startsWith("@") && !text.includes(" "),
		);
	const username = handle ? handle.slice(1) : requested;

	const books = Object.fromEntries(
		Object.values(SECTIONS).map((key) => [key, [] as Book[]]),
	) as Record<SectionKey, Book[]>;
	const counts = Object.fromEntries(
		Object.values(SECTIONS).map((key) => [key, null]),
	) as Record<SectionKey, number | null>;

	root.querySelectorAll("a[href]").forEach((anchor) => {
		const slug = sectionSlug(anchor.getAttribute("href"), username);
		if (!slug) return;

		const key = SECTIONS[slug];
		const count = toCount(anchor.text);
		if (counts[key] === null && count !== null) counts[key] = count;

		sectionBooks(anchor, username).forEach((link) => {
			const book = toBook(link);
			if (book && !books[key].some((existing) => existing.id === book.id))
				books[key].push(book);
		});
	});

	const readAllTime = toNumber(
		root.querySelector('[aria-label*="books read all time"]')?.text,
	);

	return {
		user: {
			id: pane?.getAttribute("data-user-id") || null,
			username,
			name:
				clean(
					pane?.querySelector(".profile-badges")?.parentNode?.querySelector("p")
						?.text,
				) || null,
			pronouns:
				clean(pane?.querySelector('span[title="Pronouns"]')?.text) || null,
			avatar:
				pane
					?.querySelector('img[alt$="profile picture"]')
					?.getAttribute("src") || null,
			url: `${BASE_URL}/profile/${username}`,
		},
		taste: parseTaste(root.querySelectorAll("span")),
		goal: parseGoal(root),
		counts: {
			...counts,
			read: readAllTime === null ? counts.read : readAllTime,
			readThisYear: toNumber(
				root.querySelector('[aria-label*="books read this year"]')?.text,
			),
		},
		currentlyReading: books.currentlyReading,
		read: books.read,
		toRead: books.toRead,
		fiveStarReads: books.fiveStarReads,
		owned: books.owned,
	};
};

export const GET: RequestHandler = async ({ params, setHeaders }) => {
	try {
		const root = parse(await fetchProfile(params.user));
		if (clean(root.querySelector("title")?.text).startsWith("Not Found")) {
			error(404, `there is no StoryGraph user named "${params.user}"`);
		}

		setHeaders({ "cache-control": "private, max-age=60" });
		return json(parseProfile(root, params.user));
	} catch (err) {
		if (err instanceof StorygraphError) error(err.status, err.message);
		throw err;
	}
};
