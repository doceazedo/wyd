import { type StorageValue } from "unstorage";
import { env } from "$env/dynamic/public";
import { storage } from "./db";

const DURATION = Number(env.PUBLIC_CACHE_DURATION || 1) * 60 * 60 * 1000;

export const read = async (key: string) => {
	if (!DURATION) return null;

	const { expiresAt } = await storage.getMeta(key);
	if (typeof expiresAt !== "number" || expiresAt <= Date.now()) return null;

	const value = await storage.getItem(key);

	return value === null ? null : { value, expiresAt };
};

export const write = async (key: string, value: StorageValue) => {
	if (!DURATION) return null;

	const expiresAt = Date.now() + DURATION;
	await storage.setItem(key, value);
	await storage.setMeta(key, { expiresAt });

	return expiresAt;
};

export const cacheControl = (expiresAt: number | null) => {
	if (expiresAt === null) return "no-store";

	const seconds = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));

	return `public, max-age=${seconds}`;
};
