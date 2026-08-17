import { Session } from "impers";
import { parse, type HTMLElement } from "node-html-parser";

export const BASE_URL = "https://letterboxd.com";

const POSTER_SIZE = 500;
const POSTER_CONCURRENCY = 12;

export type Film = {
	id: string | null;
	slug: string;
	title: string;
	year: number | null;
	url: string;
	reviewUrl: string | null;
	poster: string | null;
};

export type Entry = Film & {
	rating: number | null;
	liked: boolean;
	rewatched: boolean;
	reviewed: boolean;
};

export class LetterboxdError extends Error {
	status: number;

	constructor(message: string, status = 502) {
		super(message);
		this.name = "LetterboxdError";
		this.status = status;
	}
}

export const withSession = async <T>(
	use: (session: Session) => Promise<T>,
): Promise<T> => {
	const session = new Session({
		baseUrl: BASE_URL,
		impersonate: "chrome",
		timeout: 30,
	});
	try {
		return await use(session);
	} finally {
		await session.close();
	}
};

export const fetchPage = async (
	session: Session,
	path: string,
	missing: string,
): Promise<HTMLElement> => {
	const res = await session.get(path);
	if (res.status === 404) throw new LetterboxdError(missing, 404);
	if (res.status !== 200)
		throw new LetterboxdError(
			`Letterboxd responded with HTTP ${res.status} for ${path}`,
		);

	return parse(res.text);
};

export const clean = (value: string | undefined | null) => {
	const WHITESPACE = ["\n", "\r", "\t", " "];
	const flattened = WHITESPACE.reduce(
		(text, char) => text.split(char).join(" "),
		value || "",
	);
	return flattened.split(" ").filter(Boolean).join(" ");
};

export const toNumber = (value: string | undefined | null) => {
	const digits = [...(value || "")]
		.filter((char) => char >= "0" && char <= "9")
		.join("");
	return digits ? Number(digits) : null;
};

export const paragraphs = (node: HTMLElement | null | undefined) => {
	if (!node) return null;
	const parts = node
		.querySelectorAll("p")
		.map((paragraph) => clean(paragraph.text))
		.filter(Boolean);

	return (parts.length ? parts.join("\n\n") : clean(node.text)) || null;
};

export const toIsoDate = (value: string | undefined | null) =>
	value ? new Date(value).toISOString() : null;

export const absoluteUrl = (path: string | undefined | null) => {
	const href = clean(path);
	if (!href.startsWith("/")) return null;
	return `${BASE_URL}${href}`;
};

const readJson = (value: string | undefined | null) => {
	if (!value) return null;
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
};

export const classTokens = (node: HTMLElement | null | undefined) =>
	clean(node?.getAttribute("class")).split(" ").filter(Boolean);

export const starsToRating = (value: string | undefined | null) => {
	const text = clean(value);
	const full = [...text].filter((char) => char === "★").length;
	const rating = full + (text.includes("½") ? 0.5 : 0);
	return rating || null;
};

export const username = (root: HTMLElement) => {
	const owner =
		root.querySelector("body")?.getAttribute("data-owner") ||
		root.querySelector("[data-person]")?.getAttribute("data-person");
	return clean(owner) || null;
};

export const parseFilm = (component: HTMLElement | null): Film | null => {
	if (!component) return null;

	const slug = clean(component.getAttribute("data-item-slug"));
	const link = absoluteUrl(component.getAttribute("data-item-link"));
	if (!slug || !link) return null;

	const target = absoluteUrl(component.getAttribute("data-target-link"));
	const name = clean(component.getAttribute("data-item-name"));
	const open = name.lastIndexOf(" (");
	const year =
		name.endsWith(")") && open !== -1 ? name.slice(open + 2, -1) : "";
	const identifier = readJson(
		component.getAttribute("data-postered-identifier"),
	);
	const uid = typeof identifier?.uid === "string" ? identifier.uid : "";
	const alt = clean(component.querySelector("img")?.getAttribute("alt"));

	return {
		id: uid.split(":")[1] || null,
		slug,
		title: alt || (year ? name.slice(0, open) : name),
		year: toNumber(year),
		url: link,
		reviewUrl: target === link ? null : target,
		poster: null,
	};
};

export const parseEntry = (container: HTMLElement): Entry | null => {
	const film = parseFilm(
		container.querySelector('[data-component-class="LazyPoster"]'),
	);
	if (!film) return null;

	const viewing = container.querySelector("p.poster-viewingdata");
	const marks = viewing ? viewing.querySelectorAll("span, a") : [];
	const tokens = marks.flatMap((mark) => classTokens(mark));
	const rated = marks
		.map((mark) => classTokens(mark))
		.find((mark) => mark.some((token) => token.startsWith("rated-")));
	const value = toNumber(rated?.find((token) => token.startsWith("rated-")));

	return {
		...film,
		rating: value === null ? null : value / 2,
		liked: tokens.some((token) => token.startsWith("liked")),
		rewatched: tokens.includes("icon-rewatch"),
		reviewed: tokens.includes("icon-review"),
	};
};

export const withPosters = async <T extends Film>(
	session: Session,
	films: T[],
): Promise<T[]> => {
	const queue = [...new Set(films.map((film) => film.slug))];
	const posters = new Map<string, string>();

	await Promise.all(
		Array.from(
			{ length: Math.min(POSTER_CONCURRENCY, queue.length) },
			async () => {
				while (queue.length) {
					const slug = queue.shift();
					if (!slug) return;

					const res = await session.get(
						`/film/${slug}/poster/std/${POSTER_SIZE}/`,
					);
					const url = res.status === 200 ? readJson(res.text)?.url : null;
					if (typeof url === "string" && url) posters.set(slug, url);
				}
			},
		),
	);

	films.forEach((film) => {
		film.poster = posters.get(film.slug) || null;
	});

	return films;
};
