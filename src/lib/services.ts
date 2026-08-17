import { siLetterboxd, siSteam, siThestorygraph } from "simple-icons";

export type WidgetValues = Record<string, string>;

export type WidgetOption = {
	attribute: string;
	description: string;
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
	icon: string;
	widget: Widget;
};

const user = (demo: string): WidgetOption => ({
	attribute: "data-user",
	description: "Username to load the activity from",
	value: demo,
});

const count = (value: number, max?: WidgetOption["max"]): WidgetOption => ({
	attribute: "data-count",
	description: "How many items to show",
	value: `${value}`,
	min: 1,
	max,
});

const LABELS: WidgetOption = {
	attribute: "data-labels",
	description: 'Set to "false" to show only the covers',
	value: "true",
	values: ["true", "false"],
};

export const SERVICES = {
	letterboxd: {
		name: "letterboxd",
		title: "Letterboxd",
		icon: siLetterboxd.svg,
		widget: {
			name: "letterboxd",
			options: [
				user("doceazedo911"),
				count(4, (values) => (values["data-list"] === "favorites" ? 4 : null)),
				LABELS,
				{
					attribute: "data-list",
					description: "Which list to show",
					value: "recent",
					values: ["recent", "favorites"],
				},
			],
		},
	},
	steam: {
		name: "steam",
		title: "Steam",
		icon: siSteam.svg,
		widget: {
			name: "steam",
			options: [user("doceazedo911"), count(4, 4), LABELS],
		},
	},
	storygraph: {
		name: "storygraph",
		title: "Storygraph",
		icon: siThestorygraph.svg,
		widget: {
			name: "storygraph",
			options: [
				user("bibiareads"),
				count(5),
				LABELS,
				{
					attribute: "data-list",
					description: "Which list to show",
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
