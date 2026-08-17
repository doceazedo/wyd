import { error, json } from "@sveltejs/kit";
import { type HTMLElement } from "node-html-parser";
import {
	StorygraphError,
	ancestors,
	clean,
	fetchPage,
	pathSegments,
	profileUrl,
	toBook,
	toCount,
	toNumber,
	username,
	type Book,
} from "$lib/services/storygraph";
import type { RequestHandler } from "./$types";

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

const sectionSlug = (
	href: string | undefined | null,
	handle: string,
): SectionSlug | null => {
	const [slug, user, ...rest] = pathSegments(href);
	if (!slug || !user || rest.length) return null;
	if (!(slug in SECTIONS)) return null;
	if (decodeURIComponent(user).toLowerCase() !== handle.toLowerCase())
		return null;

	return slug as SectionSlug;
};

const sectionBooks = (anchor: HTMLElement, handle: string) =>
	ancestors(anchor.parentNode, 3)
		.filter(
			(node) =>
				new Set(
					node
						.querySelectorAll("a[href]")
						.map((link) => sectionSlug(link.getAttribute("href"), handle))
						.filter(Boolean),
				).size <= 1,
		)
		.map((node) => node.querySelectorAll("a.book-page-link"))
		.find((links) => links.length) || [];

const parseSections = (root: HTMLElement, handle: string) => {
	const books = Object.fromEntries(
		Object.values(SECTIONS).map((key) => [key, [] as Book[]]),
	) as Record<SectionKey, Book[]>;
	const counts = Object.fromEntries(
		Object.values(SECTIONS).map((key) => [key, null]),
	) as Record<SectionKey, number | null>;

	root.querySelectorAll("a[href]").forEach((anchor) => {
		const slug = sectionSlug(anchor.getAttribute("href"), handle);
		if (!slug) return;

		const key = SECTIONS[slug];
		const count = toCount(anchor.text);
		if (counts[key] === null && count !== null) counts[key] = count;

		sectionBooks(anchor, handle).forEach((link) => {
			const book = toBook(link);
			if (book && !books[key].some((existing) => existing.id === book.id))
				books[key].push(book);
		});
	});

	return { books, counts };
};

const parseUser = (root: HTMLElement, handle: string) => {
	const pane = root.querySelector("#profile-heading-pane");

	return {
		id: pane?.getAttribute("data-user-id") || null,
		username: handle,
		name:
			clean(
				pane?.querySelector(".profile-badges")?.parentNode?.querySelector("p")
					?.text,
			) || null,
		pronouns:
			clean(pane?.querySelector('span[title="Pronouns"]')?.text) || null,
		avatar:
			pane?.querySelector('img[alt$="profile picture"]')?.getAttribute("src") ||
			null,
		url: profileUrl(handle),
	};
};

const parseTaste = (root: HTMLElement) => {
	const spans = root.querySelectorAll("span");
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

const parseCounts = (
	root: HTMLElement,
	counts: Record<SectionKey, number | null>,
) => {
	const readAllTime = toNumber(
		root.querySelector('[aria-label*="books read all time"]')?.text,
	);

	return {
		...counts,
		read: readAllTime === null ? counts.read : readAllTime,
		readThisYear: toNumber(
			root.querySelector('[aria-label*="books read this year"]')?.text,
		),
	};
};

const parseProfile = (root: HTMLElement, requested: string) => {
	const handle = username(root) || requested;
	const { books, counts } = parseSections(root, handle);

	return {
		user: parseUser(root, handle),
		taste: parseTaste(root),
		goal: parseGoal(root),
		counts: parseCounts(root, counts),
		currentlyReading: books.currentlyReading,
		read: books.read,
		toRead: books.toRead,
		fiveStarReads: books.fiveStarReads,
		owned: books.owned,
	};
};

export const GET: RequestHandler = async ({ params }) => {
	try {
		const root = await fetchPage(
			`/profile/${encodeURIComponent(params.user)}`,
			`there is no StoryGraph user named "${params.user}"`,
		);

		return json(parseProfile(root, params.user));
	} catch (err) {
		if (err instanceof StorygraphError) error(err.status, err.message);
		throw err;
	}
};
