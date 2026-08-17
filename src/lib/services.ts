import {
	siLastdotfm,
	siLetterboxd,
	siSteam,
	siThestorygraph,
} from "simple-icons";
import { env } from "$env/dynamic/public";
import { m } from "$lib/paraglide/messages.js";

export type WidgetValues = Record<string, string>;

const DEFAULT_KIND = "now-playing";

export type WidgetOption = {
	attribute: string;
	description: () => string;
	value: string;
	values?: string[];
	min?: number;
	max?: number | ((values: WidgetValues) => number | null);
	enabled?: (values: WidgetValues) => boolean;
};

export type Widget = {
	name: string;
	options: WidgetOption[];
	ratio?: string;
};

export type Service = {
	name: string;
	title: string;
	description: () => string;
	icon: string;
	widget: Widget;
	params?: WidgetOption[];
};

export type Endpoint = {
	path: string;
	params: string[];
	query: string[];
	cache: number;
	description: () => string;
};

export const HOUR = 60 * 60;

export const RECENT_TRACKS_CACHE = 90;

export const SPOTIFY_IMAGE_CACHE_DAYS = 30;

const DEFAULT_CACHE = Number(env.PUBLIC_CACHE_DURATION || 1) * HOUR;

const user = (demo: string): WidgetOption => ({
	attribute: "data-user",
	description: m.option_user,
	value: demo,
});

const count = (value: number, max?: WidgetOption["max"]): WidgetOption => ({
	attribute: "data-count",
	description: m.option_count,
	value: `${value}`,
	min: 1,
	max,
});

const LABELS: WidgetOption = {
	attribute: "data-labels",
	description: m.option_labels,
	value: "true",
	values: ["true", "false"],
};

const LANG: WidgetOption = {
	attribute: "data-lang",
	description: m.option_lang,
	value: "default",
	values: ["default", "en", "pt"],
};

const isGrid = (values: WidgetValues) => values["data-kind"] !== DEFAULT_KIND;

const GRID: WidgetOption = {
	attribute: "data-grid",
	description: m.option_grid,
	value: "4x2",
	values: ["4x2", "5x5", "10x10"],
	enabled: isGrid,
};

const PERIOD: WidgetOption = {
	attribute: "data-period",
	description: m.option_period,
	value: "7d",
	values: ["7d", "30d", "90d", "180d", "365d", "all"],
	enabled: isGrid,
};

const LIMIT: WidgetOption = {
	attribute: "limit",
	description: m.option_limit,
	value: "10",
	min: 1,
	max: 100,
};

export const SERVICES = {
	lastfm: {
		name: "lastfm",
		title: "Last.fm",
		description: m.service_lastfm_description,
		icon: siLastdotfm.svg,
		widget: {
			name: "lastfm",
			ratio: "1 / 1",
			options: [
				user("doceazedo911"),
				LANG,
				{
					attribute: "data-kind",
					description: m.option_kind,
					value: DEFAULT_KIND,
					values: [
						DEFAULT_KIND,
						"recent-tracks",
						"top-tracks",
						"top-artists",
						"top-albums",
					],
				},
				GRID,
				PERIOD,
				{ ...LABELS, enabled: isGrid },
			],
		},
		params: [LIMIT],
	},
	letterboxd: {
		name: "letterboxd",
		title: "Letterboxd",
		description: m.service_letterboxd_description,
		icon: siLetterboxd.svg,
		widget: {
			name: "letterboxd",
			options: [
				user("doceazedo911"),
				LANG,
				{
					attribute: "data-kind",
					description: m.option_kind,
					value: "recent",
					values: ["recent", "favorites"],
				},
				count(4, (values) => (values["data-kind"] === "favorites" ? 4 : null)),
				LABELS,
			],
		},
	},
	steam: {
		name: "steam",
		title: "Steam",
		description: m.service_steam_description,
		icon: siSteam.svg,
		widget: {
			name: "steam",
			options: [user("doceazedo911"), LANG, count(4, 4), LABELS],
		},
	},
	storygraph: {
		name: "storygraph",
		title: "Storygraph",
		description: m.service_storygraph_description,
		icon: siThestorygraph.svg,
		widget: {
			name: "storygraph",
			options: [
				user("bibiareads"),
				LANG,
				{
					attribute: "data-kind",
					description: m.option_kind,
					value: "read",
					values: [
						"currently-reading",
						"read",
						"to-read",
						"five-star-reads",
						"owned",
					],
				},
				count(5),
				LABELS,
			],
		},
	},
} satisfies Record<string, Service>;

export const maxValue = (option: WidgetOption, values: WidgetValues) =>
	typeof option.max === "function" ? option.max(values) : (option.max ?? null);

export const isEnabled = (option: WidgetOption, values: WidgetValues) =>
	option.enabled ? option.enabled(values) : true;

export const attributes = (widget: Widget, values: WidgetValues) =>
	widget.options.flatMap((option) => {
		const value = values[option.attribute];

		return value && isEnabled(option, values)
			? [[option.attribute, value] as [string, string]]
			: [];
	});

const ROUTES_DIR = "/src/routes";
const ROUTE_FILE = "/+server.ts";

const DESCRIPTIONS: Record<string, () => string> = {
	"/api/lastfm/{user}/recent-tracks": m.endpoint_lastfm_recent_tracks,
	"/api/lastfm/{user}/top-albums": m.endpoint_lastfm_top_albums,
	"/api/lastfm/{user}/top-artists": m.endpoint_lastfm_top_artists,
	"/api/lastfm/{user}/top-tracks": m.endpoint_lastfm_top_tracks,
	"/api/letterboxd/{user}": m.endpoint_letterboxd,
	"/api/letterboxd/{user}/diary": m.endpoint_letterboxd_diary,
	"/api/steam/{user}/recently-played": m.endpoint_steam_recently_played,
	"/api/storygraph/{user}": m.endpoint_storygraph,
};

const CACHE: Record<string, number> = {
	"/api/lastfm/{user}/recent-tracks": RECENT_TRACKS_CACHE,
};

const QUERY: Record<string, string[]> = {
	"/api/lastfm/{user}/recent-tracks": ["limit"],
	"/api/lastfm/{user}/top-albums": ["limit", "period"],
	"/api/lastfm/{user}/top-artists": ["limit", "period"],
	"/api/lastfm/{user}/top-tracks": ["limit", "period"],
};

const paramName = (segment: string) =>
	segment.startsWith("{") && segment.endsWith("}")
		? segment.slice(1, -1)
		: null;

const toPath = (file: string) =>
	file
		.slice(ROUTES_DIR.length, -ROUTE_FILE.length)
		.split("/")
		.map((segment) =>
			segment.startsWith("[") && segment.endsWith("]")
				? `{${segment.slice(1, -1)}}`
				: segment,
		)
		.join("/");

const ENDPOINTS: Endpoint[] = Object.keys(
	import.meta.glob("/src/routes/api/**/+server.ts"),
)
	.map(toPath)
	.sort()
	.map((path) => {
		const query = QUERY[path] || [];

		return {
			path,
			params: [
				...path.split("/").flatMap((segment) => paramName(segment) || []),
				...query,
			],
			query,
			cache: CACHE[path] ?? DEFAULT_CACHE,
			description: DESCRIPTIONS[path] || (() => ""),
		};
	});

export const endpoints = (service: Service) =>
	ENDPOINTS.filter((endpoint) => endpoint.path.split("/")[2] === service.name);

export const paramOption = (service: Service, param: string): WidgetOption => {
	const extra = service.params?.find(
		(candidate) => candidate.attribute === param,
	);
	if (extra) return extra;

	const option = service.widget.options.find(
		(candidate) => candidate.attribute === `data-${param}`,
	);

	return option
		? { ...option, attribute: param }
		: { attribute: param, description: () => "", value: "" };
};

export const endpointUrl = (
	endpoint: Endpoint,
	values: WidgetValues,
	origin: string,
) => {
	const path = endpoint.path
		.split("/")
		.map((segment) => {
			const param = paramName(segment);
			if (!param) return segment;

			return values[param] ? encodeURIComponent(values[param]) : segment;
		})
		.join("/");
	const query = new URLSearchParams(
		endpoint.query.flatMap((param) =>
			values[param] ? [[param, values[param]]] : [],
		),
	).toString();

	return `${origin}${path}${query ? `?${query}` : ""}`;
};

const BOX = "background:var(--wyd-ink)";
const INK = "--wyd-ink:color-mix(in srgb,currentColor 10%,transparent)";

const DEFAULT_RATIO = "2 / 3";
const DEFAULT_COLUMNS = 5;

const SKELETON_STYLES = [
	`.wyd-skeleton{${INK};display:flex;flex-wrap:wrap;gap:.75rem;container-type:inline-size}`,
	`.wyd-skeleton i{flex:1 1 calc((100% - (var(--wyd-columns) - 1) * .75rem)/var(--wyd-columns))}`,
	`.wyd-skeleton i::before{content:"";display:block;aspect-ratio:var(--wyd-ratio);${BOX}}`,
];

const NOW_PLAYING_STYLES = [
	`.wyd-skeleton{${INK};display:flex;align-items:center;gap:.75rem;container-type:inline-size}`,
	`.wyd-skeleton i{flex:none;width:4rem;aspect-ratio:1/1;${BOX}}`,
	`.wyd-skeleton em{flex:1;display:flex;flex-direction:column;gap:.5rem}`,
	`.wyd-skeleton b{width:12rem;max-width:100%;height:.6875rem;${BOX}}`,
	`.wyd-skeleton b:last-child{width:7rem}`,
];

const SKELETON_LABEL_STYLE = [
	`.wyd-skeleton i{padding-bottom:.6875rem}`,
	`.wyd-skeleton i::after{content:"";display:block;height:.6875rem;margin:.5rem 40% 0 0;${BOX}}`,
].join("");

const SKELETON_BREAKPOINTS = [
	"@container (max-width:32rem){.wyd-skeleton i{flex-basis:calc((100% - 1.5rem)/3)}}",
	"@container (max-width:20rem){.wyd-skeleton i{flex-basis:calc((100% - .75rem)/2)}}",
];

export const gridSize = (values: WidgetValues) => {
	const [columns, rows] = (values["data-grid"] || "").split("x").map(Number);
	if (columns && rows) return { columns, rows };

	return { columns: Number(values["data-count"]) || DEFAULT_COLUMNS, rows: 1 };
};

export const skeleton = (widget: Widget, values: WidgetValues) => {
	if (values["data-kind"] === DEFAULT_KIND)
		return [
			`<style>${NOW_PLAYING_STYLES.join("")}</style>`,
			`<div class="wyd-skeleton"><i></i><em><b></b><b></b></em></div>`,
		].join("\n");

	const { columns, rows } = gridSize(values);
	const styles = [
		...SKELETON_STYLES,
		...(values["data-labels"] === "false" ? [] : [SKELETON_LABEL_STYLE]),
		...SKELETON_BREAKPOINTS,
	];
	const cells = Array.from({ length: columns * rows }, () => "<i></i>").join(
		"",
	);
	const variables = [
		`--wyd-columns: ${columns}`,
		`--wyd-ratio: ${widget.ratio || DEFAULT_RATIO}`,
	].join("; ");

	return [
		`<style>${styles.join("")}</style>`,
		`<div class="wyd-skeleton" style="${variables}">${cells}</div>`,
	].join("\n");
};

export const snippet = (
	widget: Widget,
	values: WidgetValues,
	origin: string,
) => {
	const inlined = attributes(widget, values)
		.map(([attribute, value]) => ` ${attribute}="${value}"`)
		.join("");

	return [
		`<script src="${origin}/widgets/${widget.name}.js"${inlined} async></script>`,
		skeleton(widget, values),
	].join("\n");
};
