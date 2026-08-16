/** @type {import("prettier").Config} */
const config = {
	useTabs: true,
	singleQuote: false,
	plugins: ["prettier-plugin-svelte", "prettier-plugin-tailwindcss"],
	overrides: [{ files: "*.svelte", options: { parser: "svelte" } }],
	tailwindStylesheet: "./src/routes/layout.css",
};

export default config;
