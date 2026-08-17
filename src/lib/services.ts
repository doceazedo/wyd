import { siLetterboxd, siSteam, siThestorygraph } from "simple-icons";
import { m } from "$lib/paraglide/messages.js";

export type WidgetValues = Record<string, string>;

export type WidgetOption = {
	attribute: string;
	description: () => string;
	value: string;
	values?: string[];
	min?: number;
	max?: number | ((values: WidgetValues) => number | null);
};

export type Widget = {
	name: string;
	options: WidgetOption[];
};

export type Service = {
	name: string;
	title: string;
	description: () => string;
	icon: string;
	widget: Widget;
};

export type Endpoint = {
	path: string;
	params: string[];
	description: () => string;
};

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

export const SERVICES = {
	letterboxd: {
		name: "letterboxd",
		title: "Letterboxd",
		description: m.service_letterboxd_description,
		icon: siLetterboxd.svg,
		widget: {
			name: "letterboxd",
			options: [
				user("doceazedo911"),
				count(4, (values) => (values["data-list"] === "favorites" ? 4 : null)),
				LABELS,
				{
					attribute: "data-list",
					description: m.option_list,
					value: "recent",
					values: ["recent", "favorites"],
				},
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
			options: [user("doceazedo911"), count(4, 4), LABELS],
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
				count(5),
				LABELS,
				{
					attribute: "data-list",
					description: m.option_list,
					value: "read",
					values: [
						"currently-reading",
						"read",
						"to-read",
						"five-star-reads",
						"owned",
					],
				},
			],
		},
	},
} satisfies Record<string, Service>;

export const maxValue = (option: WidgetOption, values: WidgetValues) =>
	typeof option.max === "function" ? option.max(values) : (option.max ?? null);

const ROUTES_DIR = "/src/routes";
const ROUTE_FILE = "/+server.ts";

const DESCRIPTIONS: Record<string, () => string> = {
	"/api/letterboxd/{user}": m.endpoint_letterboxd,
	"/api/letterboxd/{user}/diary": m.endpoint_letterboxd_diary,
	"/api/steam/{user}/recently-played": m.endpoint_steam_recently_played,
	"/api/storygraph/{user}": m.endpoint_storygraph,
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
	.map((path) => ({
		path,
		params: path.split("/").flatMap((segment) => paramName(segment) || []),
		description: DESCRIPTIONS[path] || (() => ""),
	}));

export const endpoints = (service: Service) =>
	ENDPOINTS.filter((endpoint) => endpoint.path.split("/")[2] === service.name);

export const paramOption = (service: Service, param: string): WidgetOption => {
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
) =>
	origin +
	endpoint.path
		.split("/")
		.map((segment) => {
			const param = paramName(segment);
			if (!param) return segment;

			return values[param] ? encodeURIComponent(values[param]) : segment;
		})
		.join("/");

const BOX = "background:var(--wyd-ink)";

const SKELETON_STYLES = [
	`.wyd-skeleton{--wyd-ink:color-mix(in srgb,currentColor 10%,transparent);display:flex;flex-wrap:wrap;gap:.75rem;container-type:inline-size}`,
	`.wyd-skeleton i{flex:1 1 calc((100% - (var(--wyd-columns) - 1) * .75rem)/var(--wyd-columns))}`,
	`.wyd-skeleton i::before{content:"";display:block;aspect-ratio:2/3;${BOX}}`,
];

const SKELETON_LABEL_STYLE = [
	`.wyd-skeleton i{padding-bottom:.6875rem}`,
	`.wyd-skeleton i::after{content:"";display:block;height:.6875rem;margin:.5rem 40% 0 0;${BOX}}`,
].join("");

const SKELETON_BREAKPOINTS = [
	"@container (max-width:32rem){.wyd-skeleton i{flex-basis:calc((100% - 1.5rem)/3)}}",
	"@container (max-width:20rem){.wyd-skeleton i{flex-basis:calc((100% - .75rem)/2)}}",
];

export const skeleton = (values: WidgetValues) => {
	const columns = Number(values["data-count"]) || 5;
	const styles = [
		...SKELETON_STYLES,
		...(values["data-labels"] === "false" ? [] : [SKELETON_LABEL_STYLE]),
		...SKELETON_BREAKPOINTS,
	];
	const cells = Array.from({ length: columns }, () => "<i></i>").join("");

	return [
		`<style>${styles.join("")}</style>`,
		`<div class="wyd-skeleton" style="--wyd-columns: ${columns}">${cells}</div>`,
	].join("\n");
};

export const snippet = (
	widget: Widget,
	values: WidgetValues,
	origin: string,
) => {
	const attributes = Object.entries(values)
		.filter(([, value]) => !!value)
		.map(([attribute, value]) => ` ${attribute}="${value}"`)
		.join("");

	return [
		`<script src="${origin}/widgets/${widget.name}.js"${attributes} async></script>`,
		skeleton(values),
	].join("\n");
};
