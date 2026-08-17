export type Item = {
	id: string;
	title: string;
	subtitle: string | null;
	rating: number | null;
	image: string | null;
	url: string;
};

export type WidgetProps = {
	api: string;
	user?: string;
	count?: string;
	grid?: string;
	kind?: string;
	period?: string;
	labels?: string;
	lang?: string;
};
