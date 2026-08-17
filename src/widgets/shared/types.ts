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
	list?: string;
	labels?: string;
};
