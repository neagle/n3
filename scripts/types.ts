import dayjs from 'https://esm.sh/dayjs@1.11.7';

export type ParsedFrontMatter = {
	frontMatter: string;
	body: string;
	attrs: Record<string, unknown>;
};

export type ParsedFile = {
	frontMatter: string;
	body: string;
	titleSlug?: string;
	file?: string;
	destinationFile?: string;
	link?: string;
	attributes: {
		title?: string;
		description?: string;
		date?: Date | dayjs.Dayjs;
		tags?: string[];
		extension?: string;
		unlisted?: boolean;
		layout?: string;
		recipe?: {
			title?: string;
			ingredients?: Ingredient[];
			directions?: string;
		};
	};
	comments?: ParsedFile[];
};

export type Ingredient = {
	quantity: string;
	unit: string;
	name: string;
} | string;

export type SiteInfo = {
	config: {
		author: {
			name: string;
			email: string;
		};
		site: string;
	};
	postFiles: string[];
	posts: ParsedFile[];
	pageFiles: string[];
	pages: ParsedFile[];
	tags: Record<string, ParsedFile[]>;
};
