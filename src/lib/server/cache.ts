import { createDatabase } from "db0";
import sqlite from "db0/connectors/node-sqlite";
import { createStorage, type StorageValue } from "unstorage";
import db0Driver from "unstorage/drivers/db0";
import { env } from "$env/dynamic/public";

const DURATION = Number(env.PUBLIC_CACHE_DURATION || 1) * 60 * 60 * 1000;

const storage = createStorage({
	driver: db0Driver({
		database: createDatabase(sqlite({ name: "cache" })),
		tableName: "cache",
	}),
});

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
