import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { build } from "vite";

const SHARED = "shared";
const PLACEHOLDER = "__WIDGET_STYLES__";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = new URL("../src/widgets/", import.meta.url);
const watch = process.argv.includes("--watch");

const widgets = readdirSync(source, { withFileTypes: true })
	.filter((entry) => entry.isDirectory() && entry.name !== SHARED)
	.map((entry) => entry.name);

const inlineStyles = () => ({
	name: "inline-widget-styles",
	enforce: "post",
	generateBundle(options, bundle) {
		const files = Object.values(bundle);
		const stylesheets = files.filter(
			(file) => file.type === "asset" && file.fileName.endsWith(".css"),
		);
		const css = stylesheets
			.map((stylesheet) => stylesheet.source.toString())
			.join("");

		stylesheets.forEach((stylesheet) => delete bundle[stylesheet.fileName]);
		files
			.filter((file) => file.type === "chunk")
			.forEach((chunk) => {
				chunk.code = chunk.code
					.split(PLACEHOLDER)
					.join(JSON.stringify(css.trim()));
			});
	},
});

const bundleWidget = (name, first) =>
	build({
		root,
		configFile: false,
		mode: "production",
		logLevel: "warn",
		plugins: [svelte({ compilerOptions: { runes: true } }), inlineStyles()],
		build: {
			target: "es2020",
			outDir: "static/widgets",
			emptyOutDir: first,
			watch: watch ? {} : null,
			lib: {
				entry: `src/widgets/${name}/index.ts`,
				formats: ["iife"],
				name: `wyd_${name}`,
				fileName: () => `${name}.js`,
			},
		},
	});

await widgets.reduce(
	(previous, name, index) =>
		previous.then(() => bundleWidget(name, index === 0 && !watch)),
	Promise.resolve(),
);

console.log(`built ${widgets.length} widgets: ${widgets.join(", ")}`);
