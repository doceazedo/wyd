import { mount, type Component } from "svelte";
import type { WidgetProps } from "./types";

declare const __WIDGET_STYLES__: string;

const SKELETON = "wyd-skeleton";
const VARIABLES = ["--wyd-columns", "--wyd-ratio"];
const PASSTHROUGH = ["STYLE", "LINK"];
const BASE_STYLES = ":host { display: block; container-type: inline-size; }";

const script = document.currentScript as HTMLScriptElement | null;

const apiOrigin = (source: string) => {
	try {
		return new URL(source, location.href).origin;
	} catch {
		return location.origin;
	}
};

const findSkeleton = () => {
	let node = script?.nextElementSibling || null;
	while (node && PASSTHROUGH.includes(node.tagName))
		node = node.nextElementSibling;

	return node?.classList.contains(SKELETON) ? node : null;
};

const prune = (element: Element, attribute: string) => {
	if (!element.getAttribute(attribute)) element.removeAttribute(attribute);
};

const takeOver = (skeleton: Element) => {
	skeleton.classList.remove(SKELETON);
	if (skeleton instanceof HTMLElement)
		VARIABLES.forEach((variable) => skeleton.style.removeProperty(variable));
	skeleton.replaceChildren();
	prune(skeleton, "class");
	prune(skeleton, "style");

	return skeleton;
};

const createHost = (sibling: HTMLScriptElement) => {
	const host = document.createElement("div");
	sibling.parentNode?.insertBefore(host, sibling.nextSibling);

	return host;
};

const render = (component: Component<WidgetProps>) => {
	if (!script?.parentNode) return;

	const skeleton = findSkeleton();
	const host = skeleton ? takeOver(skeleton) : createHost(script);
	const shadow = host.attachShadow({ mode: "open" });
	const styles = document.createElement("style");
	styles.textContent = `${BASE_STYLES}${__WIDGET_STYLES__}`;
	shadow.append(styles);

	mount(component, {
		target: shadow,
		props: { api: apiOrigin(script.src), ...script.dataset },
	});
};

export const embed = (component: Component<WidgetProps>) => {
	if (!findSkeleton() && document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => render(component), {
			once: true,
		});
		return;
	}

	render(component);
};
