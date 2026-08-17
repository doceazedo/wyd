const FALLBACK = "en";
const DEFAULT = "default";

const MESSAGES = {
	en: {
		emptyFilms: "No films to show here yet.",
		emptyGames: "No games played recently.",
		emptyBooks: "No books to show here yet.",
		playtimeMinutes: (value: string) => `${value}min past 2 weeks`,
		playtimeHours: (value: string) => `${value}h past 2 weeks`,
	},
	pt: {
		emptyFilms: "Nenhum filme pra mostrar aqui ainda.",
		emptyGames: "Nenhum jogo jogado recentemente.",
		emptyBooks: "Nenhum livro pra mostrar aqui ainda.",
		playtimeMinutes: (value: string) => `${value}min em 2 semanas`,
		playtimeHours: (value: string) => `${value}h em 2 semanas`,
	},
};

type Locale = keyof typeof MESSAGES;

const isLocale = (value: string): value is Locale => value in MESSAGES;

const normalize = (value: string) => value.trim().toLowerCase().split("-")[0];

const requested = (lang?: string) => {
	if (lang && normalize(lang) !== DEFAULT) return [lang];

	return navigator.languages?.length
		? navigator.languages
		: [navigator.language];
};

export const translations = (lang?: string) =>
	MESSAGES[requested(lang).map(normalize).find(isLocale) || FALLBACK];
