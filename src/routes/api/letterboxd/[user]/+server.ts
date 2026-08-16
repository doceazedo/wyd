import { error, json } from "@sveltejs/kit";
import { type HTMLElement } from "node-html-parser";
import {
	BASE_URL,
	LetterboxdError,
	absoluteUrl,
	clean,
	fetchPage,
	paragraphs,
	parseEntry,
	parseFilm,
	starsToRating,
	toIsoDate,
	toNumber,
	username,
	withPosters,
	withSession,
	type Entry,
	type Film,
} from "$lib/services/letterboxd";
import type { RequestHandler } from "./$types";

const STATS = {
	films: "films",
	"this year": "filmsThisYear",
	following: "following",
	followers: "followers",
} as const;

type StatKey = (typeof STATS)[keyof typeof STATS];

type Review = {
	id: string | null;
	film: Film;
	rating: number | null;
	liked: boolean;
	text: string | null;
	watchedAt: string | null;
	url: string | null;
};

const parseUser = (root: HTMLElement, requested: string) => {
	const handle = username(root) || requested;
	const display = root.querySelector("h1.person-display-name .displayname");

	return {
		username: handle,
		name: clean(display?.querySelector(".label")?.text) || null,
		avatar:
			root.querySelector(".profile-avatar img")?.getAttribute("src") || null,
		bio: paragraphs(root.querySelector(".js-bio-content")),
		links: root
			.querySelectorAll(".profile-metadata a.metadatum")
			.map((link) => ({
				label: clean(link.querySelector(".label")?.text) || null,
				url: link.getAttribute("href") || null,
			})),
		url: `${BASE_URL}/${handle}/`,
	};
};

const sectionCount = (root: HTMLElement, suffix: string) => {
	const section = root
		.querySelectorAll("section.section")
		.find((candidate) =>
			clean(
				candidate.querySelector(".section-heading a")?.getAttribute("href"),
			).endsWith(suffix),
		);

	return toNumber(section?.querySelector("a.all-link")?.text);
};

const parseCounts = (root: HTMLElement) => {
	const counts = Object.fromEntries(
		Object.values(STATS).map((key) => [key, null]),
	) as Record<StatKey, number | null>;

	root.querySelectorAll(".profile-stats .profile-statistic").forEach((stat) => {
		const definition = clean(
			stat.querySelector(".definition")?.text,
		).toLowerCase();
		const key = STATS[definition as keyof typeof STATS];
		if (key) counts[key] = toNumber(stat.querySelector(".value")?.text);
	});

	return {
		...counts,
		diary: sectionCount(root, "/diary/"),
	};
};

const parseRatings = (root: HTMLElement) =>
	root
		.querySelectorAll(".ratings-histogram-chart tbody.plot tr.column")
		.map((column, index) => {
			const summary = clean(column.querySelector("td ._sr-only")?.text);
			const open = summary.indexOf("(");

			return {
				rating: (index + 1) / 2,
				count: toNumber(open === -1 ? summary : summary.slice(0, open)) || 0,
				percent: open === -1 ? 0 : toNumber(summary.slice(open)) || 0,
			};
		});

const parseReview = (article: HTMLElement): Review | null => {
	const film = parseFilm(
		article.querySelector('[data-component-class="LazyPoster"]'),
	);
	if (!film) return null;

	const uid = clean(article.getAttribute("data-object-id"));
	const rating = article.querySelector(".inline-rating svg");

	return {
		id: uid.split(":")[1] || null,
		film,
		rating: starsToRating(rating?.getAttribute("aria-label")),
		liked: !!article.querySelector("svg.inline-liked"),
		text: paragraphs(article.querySelector(".js-review-body")),
		watchedAt: toIsoDate(
			article.querySelector("time.timestamp")?.getAttribute("datetime"),
		),
		url: absoluteUrl(
			article.querySelector(".attribution-detail a")?.getAttribute("href"),
		),
	};
};

const entries = (root: HTMLElement, selector: string): Entry[] =>
	root
		.querySelectorAll(`${selector} li.griditem`)
		.map((item) => parseEntry(item))
		.filter((entry) => !!entry);

const parseProfile = (root: HTMLElement, requested: string) => {
	const favorites = entries(root, "#favourites").map(
		({ id, slug, title, year, url, poster }) => ({
			id,
			slug,
			title,
			year,
			url,
			poster,
		}),
	);
	const recent = entries(root, "#recent-activity");
	const reviews = root
		.querySelectorAll("article.production-viewing")
		.map((article) => parseReview(article))
		.filter((review) => !!review);

	return {
		user: parseUser(root, requested),
		counts: parseCounts(root),
		ratings: parseRatings(root),
		favorites,
		recent,
		reviews,
	};
};

export const GET: RequestHandler = async ({ params }) => {
	try {
		const profile = await withSession(async (session) => {
			const root = await fetchPage(
				session,
				`/${encodeURIComponent(params.user)}/`,
				`there is no Letterboxd user named "${params.user}"`,
			);
			const parsed = parseProfile(root, params.user);
			await withPosters(session, [
				...parsed.favorites,
				...parsed.recent,
				...parsed.reviews.map((review) => review.film),
			]);

			return parsed;
		});

		return json(profile);
	} catch (err) {
		if (err instanceof LetterboxdError) error(err.status, err.message);
		throw err;
	}
};
