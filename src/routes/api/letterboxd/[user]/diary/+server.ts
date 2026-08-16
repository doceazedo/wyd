import { error, json } from "@sveltejs/kit";
import { type HTMLElement } from "node-html-parser";
import {
	BASE_URL,
	LetterboxdError,
	absoluteUrl,
	classTokens,
	clean,
	fetchPage,
	parseFilm,
	toIsoDate,
	toNumber,
	username,
	withPosters,
	withSession,
	type Film,
} from "$lib/services/letterboxd";
import type { RequestHandler } from "./$types";

type DiaryEntry = {
	id: string | null;
	film: Film;
	watchedAt: string | null;
	rating: number | null;
	liked: boolean;
	rewatched: boolean;
	reviewed: boolean;
	url: string | null;
};

const hasIcon = (row: HTMLElement, selector: string) => {
	const cell = row.querySelector(selector);
	return !!cell && !classTokens(cell).includes("icon-status-off");
};

const parseDate = (row: HTMLElement) => {
	const segments = clean(row.querySelector("a.daydate")?.getAttribute("href"))
		.split("/")
		.filter(Boolean)
		.slice(-3);
	if (segments.length !== 3 || segments.some((part) => toNumber(part) === null))
		return null;

	return toIsoDate(segments.join("-"));
};

const parseDiaryEntry = (row: HTMLElement): DiaryEntry | null => {
	const film = parseFilm(
		row.querySelector('[data-component-class="LazyPoster"]'),
	);
	if (!film) return null;

	const uid = clean(row.getAttribute("data-object-id"));
	const rated = toNumber(
		row.querySelector("input.rateit-field")?.getAttribute("value"),
	);

	return {
		id: uid.split(":")[1] || null,
		film,
		watchedAt: parseDate(row),
		rating: rated ? rated / 2 : null,
		liked: !!row.querySelector("td.col-like .icon-liked"),
		rewatched: hasIcon(row, "td.col-rewatch"),
		reviewed: hasIcon(row, "td.col-review"),
		url: absoluteUrl(
			row.querySelector("h2.primaryname a")?.getAttribute("href"),
		),
	};
};

const parseDiary = (root: HTMLElement, requested: string) => {
	const handle = username(root) || requested;
	const entries = root
		.querySelectorAll("tr.diary-entry-row")
		.map((row) => parseDiaryEntry(row))
		.filter((entry) => !!entry);

	return {
		user: {
			username: handle,
			url: `${BASE_URL}/${handle}/films/diary/`,
		},
		count: toNumber(
			clean(
				root
					.querySelector("h1.section-heading .tooltip")
					?.getAttribute("title"),
			),
		),
		entries,
	};
};

export const GET: RequestHandler = async ({ params }) => {
	try {
		const diary = await withSession(async (session) => {
			const root = await fetchPage(
				session,
				`/${encodeURIComponent(params.user)}/films/diary/`,
				`there is no Letterboxd user named "${params.user}"`,
			);
			const parsed = parseDiary(root, params.user);
			await withPosters(
				session,
				parsed.entries.map((entry) => entry.film),
			);

			return parsed;
		});

		return json(diary);
	} catch (err) {
		if (err instanceof LetterboxdError) error(err.status, err.message);
		throw err;
	}
};
