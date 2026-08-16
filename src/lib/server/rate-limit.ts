import { env } from "$env/dynamic/private";
import { storage } from "./db";

const LIMIT = Number(env.RATE_LIMIT || 0);
const BLOCK = Number(env.RATE_LIMIT_BLOCK_DURATION || 5) * 60 * 1000;
const WINDOW = 60 * 1000;

type Counter = {
	count: number;
	resetAt: number;
};

export const consume = async (ip: string) => {
	if (!LIMIT) return null;

	const key = `ratelimit:${ip}`;
	const now = Date.now();
	const current = await storage.getItem<Counter>(key);
	const active = current && current.resetAt > now ? current : null;

	if (active && active.count > LIMIT) return { ...active, exceeded: true };

	const count = active ? active.count + 1 : 1;
	const exceeded = count > LIMIT;
	const counter = {
		count,
		resetAt: exceeded ? now + BLOCK : (active?.resetAt ?? now + WINDOW),
	};

	await storage.setItem(key, counter);

	return { ...counter, exceeded };
};

export const retryAfter = (resetAt: number) =>
	Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)).toString();
