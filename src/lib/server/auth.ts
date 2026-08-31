import { timingSafeEqual } from "node:crypto";
import { env } from "$env/dynamic/private";

export const COOKIE = "stats_secret";

export const MAX_AGE = 60 * 60 * 24 * 365;

const secret = () => env.STATS_PAGE_SECRET || "";

export const enabled = () => Boolean(secret());

export const matches = (value: string | undefined | null) => {
	const expected = secret();
	if (!expected || !value) return false;

	const given = Buffer.from(value);
	const wanted = Buffer.from(expected);

	return given.length === wanted.length && timingSafeEqual(given, wanted);
};
