import parse from './parse.ts';
import { parse as parseArgs } from 'https://deno.land/std@0.175.0/flags/mod.ts';
import pug from 'npm:pug';
import xmlEscape from 'npm:xml-escape';
import sass from 'npm:sass';
import { ParsedFile, SiteInfo } from './types.ts';
import { parseIngredients } from './utils/recipe.ts';
import * as path from 'https://deno.land/std@0.179.0/path/mod.ts';

const CHECKMARK = ' ✓';

const flags = parseArgs(Deno.args, {
	boolean: ['clean', 'pages'],
	default: { clean: true },
});
async function buildPosts(siteInfo: SiteInfo) {
	console.log('📝 Building posts...');
	await Deno.mkdir(`./dist/posts`, { recursive: true });

	await Promise.all(
		siteInfo.posts.map(async (post: ParsedFile) => {
			if (post?.attributes?.recipe?.ingredients !== undefined) {
				post.attributes.recipe.ingredients = parseIngredients(
					post.attributes.recipe.ingredients as string[],
				);
			}

			const renderedPost = pug.renderFile('./src/templates/post.pug', {
				body: post.body,
				...post.attributes,
				posts: siteInfo.posts,
				titleSlug: post.titleSlug,
				comments: post.comments,
				author: siteInfo.config.author,
				site: siteInfo.config.site,
			});

			const postPath = path.join('./dist/', post.link || '');
			await Deno.mkdir(postPath, { recursive: true });

			return Deno.writeTextFile(`${postPath}/index.html`, renderedPost);
		}),
	);

	console.log(`${CHECKMARK} Built ${siteInfo.posts.length} posts.`);
}

async function buildPages(siteInfo: SiteInfo) {
	console.log('📝 Building pages...');

	await Promise.all(
		siteInfo.pages.map(async (page) => {
			if (!page.destinationFile || !page.file) {
				return;
			}

			const filename = path.basename(page.file, '.pug');

			// Construct an object of all the data we need to pass to the template
			const globals = {
				name: filename,
				link: page.link,
				posts: siteInfo.posts,
				tags: siteInfo.tags,
				...page.attributes,
				author: siteInfo.config.author,
				site: siteInfo.config.site,
				utils: {
					xmlEscape,
				},
			};

			let renderedPage;
			if (page.attributes.layout !== 'nil') {
				// Some pages, like xml feeds, may want to be rendered without any layout
				renderedPage = pug.render(page.body, {
					...globals,
				});
			} else {
				renderedPage = pug.renderFile('./src/templates/page.pug', {
					body: pug.render(page.body, {
						...globals,
					}),
					...globals,
				});
			}

			// Create the directory if it doesn't exist
			await Deno.mkdir(`./dist/${path.dirname(page.destinationFile)}`, {
				recursive: true,
			});

			return Deno.writeTextFile(`./dist${page.destinationFile}`, renderedPage);
		}),
	);

	console.log(
		`${CHECKMARK} Built ${Object.keys(siteInfo.pages).length} pages.`,
	);
}

async function buildTagPages(siteInfo: SiteInfo) {
	console.log('🏷️  Building tag pages...');
	await Promise.all(
		Object.entries(siteInfo.tags).map(async ([tag, posts]) => {
			const tagPage = pug.renderFile('./src/templates/tag.pug', {
				tag,
				posts,
				author: siteInfo.config.author,
				site: siteInfo.config.site,
			});

			await Deno.mkdir(`./dist/tag/${tag}`, { recursive: true });
			await Deno.writeTextFile(`./dist/tag/${tag}/index.html`, tagPage);
		}),
	);

	console.log(
		`${CHECKMARK} Built ${Object.keys(siteInfo.tags).length} tag pages.`,
	);
}

function buildStyles() {
	console.log('🎨 Building styles...');
	const result = sass.compile('./src/styles/main.scss');
	return Deno.writeTextFile('./dist/main.css', result.css.toString());
}

async function buildScripts() {
	console.log('📜 Building scripts...');
	// Obviously at some point we'll replace this with something real.
	await Deno.mkdir(`./dist/scripts`, { recursive: true });
	await Deno.copyFile('./src/scripts/main.js', './dist/scripts/main.js');
}

const siteInfo = await parse();

const builders: {
	[key: string]: (siteInfo: SiteInfo) => Promise<void>;
	styles: () => Promise<void>;
	scripts: () => Promise<void>;
} = {
	posts: buildPosts,
	pages: buildPages,
	tags: buildTagPages,
	styles: buildStyles,
	scripts: buildScripts,
};

const buildFlags = Object.keys(flags).filter((flag) => /^build/.test(flag));

if (flags.clean && !buildFlags.length) {
	console.log('💥 Blowing away the old dist folder!');
	try {
		await Deno.remove('./dist', { recursive: true });
	} catch (_error) {
		console.log('🤷‍♀️ No dist folder to remove.');
	}
}

// Make sure the dist folder exists
await Deno.mkdir(`./dist/`, { recursive: true });

if (buildFlags.length) {
	buildFlags.forEach(async (flag) => {
		const builder = flag.replace('build', '').toLowerCase();
		if (typeof builders[builder] === 'function') {
			await builders[builder](siteInfo);
		}
	});
} else {
	for (const builder in builders) {
		await builders[builder](siteInfo);
	}

	console.log(`${CHECKMARK} Built site.`);
}
