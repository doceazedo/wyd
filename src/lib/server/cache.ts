import { type StorageValue } from "unstorage";
import { env } from "$env/dynamic/public";
import { storage } from "./db";

const DURATION = Number(env.PUBLIC_CACHE_DURATION || 1) * 60 * 60 * 1000;
const PARAMS = ["limit", "period"];
const MAX_AGE = "max-age=";

export const key = (url: URL) =>
	[
		url.pathname,
		...PARAMS.flatMap((param) => {
			const value = url.searchParams.get(param);

			return value ? [`${param}=${encodeURIComponent(value)}`] : [];
		}),
	].join("/");

export const maxAge = (header: string | null) => {
	const directive = (header || "")
		.split(",")
		.map((part) => part.trim())
		.find((part) => part.startsWith(MAX_AGE));
	if (!directive) return null;

	const seconds = Number(directive.slice(MAX_AGE.length));

	return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null;
};

export const read = async (key: string) => {
	if (!DURATION) return null;

	const { expiresAt } = await storage.getMeta(key);
	if (typeof expiresAt !== "number" || expiresAt <= Date.now()) return null;

	const value = await storage.getItem(key);

	return value === null ? null : { value, expiresAt };
};

export const write = async (
	key: string,
	value: StorageValue,
	duration = DURATION,
) => {
	if (!DURATION) return null;

	const expiresAt = Date.now() + duration;
	await storage.setItem(key, value);
	await storage.setMeta(key, { expiresAt });

	return expiresAt;
};

export const cacheControl = (expiresAt: number | null) => {
	if (expiresAt === null) return "no-store";

	const seconds = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));

	return `public, max-age=${seconds}`;
};
