import inquirer from 'npm:inquirer';
import cheerio from 'https://esm.sh/cheerio';
import slugify from 'https://esm.sh/@sindresorhus/slugify';
import dayjs from 'npm:dayjs@1.11.7';

let type = Deno.args[0];
const types = ['bookmark', 'post'];

if (!type || !types.includes(type)) {
	const answer = await inquirer.prompt([
		{
			type: 'list',
			name: 'type',
			message: 'What would you like to add?',
			choices: types,
		},
	]);
	type = answer.type;
}

const create: {
	[key: string]: () => Promise<void>;
} = {
	bookmark: async () => {
		const { url } = await inquirer.prompt([
			{
				type: 'input',
				name: 'url',
				message: 'Bookmark URL?',
			},
		]);

		// Try to get a title and a description to serve as defaults from the
		// bookmark page itself

		let titleFromUrl;
		let descriptionFromUrl;
		try {
			const response = await fetch(url);
			const html = await response.text();
			const $ = cheerio.load(html);

			const title = $('title').text();
			if (title) {
				titleFromUrl = title.trim();
			}

			const description = $('meta[name="description"]').attr('content');
			if (description) {
				descriptionFromUrl = description.trim();
			}
		} catch (error) {
			console.log(error);
		}

		const { title } = await inquirer.prompt([
			{
				type: 'input',
				default: titleFromUrl,
				name: 'title',
				message: 'Bookmark title?',
				validate: (
					input: string,
				) => (input.length > 0 ? true : 'Title is required'),
			},
		]);

		const { description, tags, source } = await inquirer.prompt([
			{
				type: 'input',
				name: 'description',
				message: 'Bookmark description?',
				default: descriptionFromUrl,
			},

			{
				type: 'input',
				name: 'tags',
				message: 'Bookmark tags?',
			},

			{
				type: 'input',
				name: 'source',
				message: 'Bookmark source?',
			},
		]);

		const newBookmark = {
			url,
			title,
			description,
			tags,
			source,
			date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
		};

		let bookmarkFrontmatter = `---\n`;
		bookmarkFrontmatter += Object.entries(newBookmark)
			.reduce((arr, [key, value]) => {
				if (key === 'tags') {
					arr.push(yamlList(key, value));
				} else {
					arr.push(`${key}: ${value}`);
				}
				return arr;
			}, [] as string[])
			.join('\n');
		bookmarkFrontmatter += `\n---`;

		const filename = './src/content/bookmarks/' +
			slugify(newBookmark.title, { lower: true, strict: true }) +
			'.md';
		if (await exists(filename)) {
			console.log(`File already exists with that name: ${filename}`);
		} else {
			await Deno.writeTextFile(filename, bookmarkFrontmatter);
		}

		console.log(`Bookmark created: ${filename}`);
	},
	post: async () => {
		const { title, description, tags } = await inquirer.prompt([
			{
				type: 'input',
				name: 'title',
				message: 'Post title?',
			},
			{
				type: 'input',
				name: 'description',
				message: 'Post description?',
			},

			{
				type: 'input',
				name: 'tags',
				message: 'Post tags?',
			},
		]);

		const newPost = {
			title,
			description,
			tags,
			date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
		};

		let frontmatter = `---\n`;
		frontmatter += Object.entries(newPost)
			.reduce((arr, [key, value]) => {
				if (value) {
					if (key === 'tags') {
						arr.push(yamlList(key, value));
					} else {
						arr.push(`${key}: ${value}`);
					}
				}
				return arr;
			}, [] as string[])
			.join('\n');
		frontmatter += `\n---`;

		const filepath = `./src/content/posts/${
			slugify(newPost.title, { lower: true, strict: true })
		}/`;

		if (await exists(filepath)) {
			console.log(`A post already exists with that path: ${filepath}`);
		} else {
			await Deno.mkdir(filepath);
			await Deno.writeTextFile(`${filepath}/index.md`, frontmatter);
			console.log(`Post created: ${filepath}index.md`);
			Deno.run({ cmd: ['code', `${filepath}index.md`] });
		}
	},
};

const exists = async (filename: string): Promise<boolean> => {
	try {
		await Deno.stat(filename);
		// successful, file or directory must exist
		return true;
	} catch (error) {
		if (error instanceof Deno.errors.NotFound) {
			// file or directory does not exist
			return false;
		} else {
			// unexpected error, maybe permissions, pass it along
			throw error;
		}
	}
};

const yamlList = (key: string, value: string, indentation = ''): string => {
	return `${key}:\n- ${
		value
			.split(' ')
			.map((tag) => tag.trim())
			.join(`\n${indentation}- `)
	}`;
};

create[type]();
