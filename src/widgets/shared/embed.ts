import { mount, type Component } from "svelte";
import type { WidgetProps } from "./types";

declare const __WIDGET_STYLES__: string;

const BASE_STYLES = ":host { display: block; container-type: inline-size; }";

const script = document.currentScript as HTMLScriptElement | null;

const apiOrigin = (source: string) => {
	try {
		return new URL(source, location.href).origin;
	} catch {
		return location.origin;
	}
};

export const embed = (component: Component<WidgetProps>) => {
	if (!script?.parentNode) return;

	const host = document.createElement("div");
	script.parentNode.insertBefore(host, script);

	const shadow = host.attachShadow({ mode: "open" });
	const styles = document.createElement("style");
	styles.textContent = `${BASE_STYLES}${__WIDGET_STYLES__}`;
	shadow.append(styles);

	mount(component, {
		target: shadow,
		props: { api: apiOrigin(script.src), ...script.dataset },
	});
};
