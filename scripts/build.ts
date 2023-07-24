import parse from './parse.ts';
import { parse as parseArgs } from 'https://deno.land/std@0.175.0/flags/mod.ts';
import pug from 'npm:pug';
import pugFilterMarkdown from 'npm:@metamodern/pug-filter-markdown';
import xmlEscape from 'npm:xml-escape';
import * as sass from 'npm:sass';
import { ParsedFile, SiteInfo } from './types.ts';
import { parseIngredients } from './utils/recipe.ts';
import * as path from 'https://deno.land/std@0.179.0/path/mod.ts';
import * as fs from 'https://deno.land/std@0.179.0/fs/mod.ts';
import { ensureDir } from 'https://deno.land/std@0.114.0/fs/mod.ts';
import { bundle } from 'https://deno.land/x/emit/mod.ts';

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
				basedir: './src/templates',
				body: post.body,
				...post.attributes,
				posts: siteInfo.posts,
				titleSlug: post.titleSlug,
				comments: post.comments,
				author: siteInfo.config.author,
				site: siteInfo.config.site,
				link: post.link,
				filters: {
					md: pugFilterMarkdown,
				},
			});

			const postPath = path.join('./dist/', post.link || '');
			await Deno.mkdir(postPath, { recursive: true });

			if (post.attributes.supportFiles?.length) {
				await Promise.all(
					post.attributes.supportFiles.map(async (file) => {
						const destinationPath = path.basename(file);

						if (destinationPath.includes('/')) {
							const directoryPath = path.dirname(destinationPath);
							await ensureDir(`${postPath}/${directoryPath}`);
						}

						return Deno.copyFile(
							file,
							`${postPath}/${destinationPath}`,
						);
					}),
				);
			}

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
				basedir: './src/templates',
				filename: filename,
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
				filters: {
					md: pugFilterMarkdown,
				},
			};

			let renderedPage;
			if (page.attributes.layout === 'nil') {
				// Some pages, like xml feeds, may want to be rendered without any layout
				renderedPage = pug.render(page.body, {
					...globals,
				});
			} else {
				renderedPage = pug.renderFile('./src/templates/page.pug', {
					// filename: './src/templates/page.pug',
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
				basedir: './src/templates',
				tag,
				posts,
				author: siteInfo.config.author,
				site: siteInfo.config.site,
				filters: {
					md: pugFilterMarkdown,
				},
			});

			await Deno.mkdir(`./dist/tag/${tag}`, { recursive: true });
			await Deno.writeTextFile(`./dist/tag/${tag}/index.html`, tagPage);
		}),
	);

	console.log(
		`${CHECKMARK} Built ${Object.keys(siteInfo.tags).length} tag pages.`,
	);
}

async function buildStyles() {
	console.log('🎨 Building styles...');
	await Deno.mkdir(`./dist/styles`, { recursive: true });
	for await (
		const file of fs.expandGlob('./src/styles/**/*.scss')
	) {
		// Ignore directories and partials
		if (file.isFile && !file.name.startsWith('_')) {
			const destinationPath = path.relative('./src/styles', file.path);
			if (destinationPath.includes('/')) {
				const directoryPath = path.dirname(destinationPath);
				await ensureDir(`./dist/styles/${directoryPath}`);
			}

			const compiledSass = sass.compile(file.path);
			await Deno.writeTextFile(
				`./dist/styles/${destinationPath.replace('.scss', '.css')}`,
				compiledSass.css.toString(),
			);
		}
	}
}

async function buildScripts() {
	console.log('📜 Building scripts...');
	// Obviously at some point we'll replace this with something real.
	await Deno.mkdir(`./dist/scripts`, { recursive: true });
	for await (const file of fs.expandGlob('./src/scripts/**/*')) {
		const filepath = path.relative('./src/files', file.path);
		if (file.isDirectory) {
			await Deno.mkdir(`./dist/scripts/${filepath}`, { recursive: true });
		} else if (file.isFile) {
			await Deno.copyFile(file.path, `./dist/scripts/${filepath}`);
		}
	}
}

async function buildFiles() {
	console.log('📁 Building files...');
	for await (const file of fs.expandGlob('./src/files/**/*')) {
		const filepath = path.relative('./src/files', file.path);
		if (file.isDirectory) {
			await Deno.mkdir(`./dist/${filepath}`, { recursive: true });
		} else if (file.isFile) {
			await Deno.copyFile(file.path, `./dist/${filepath}`);
		}
	}
}

async function buildTypeScripts() {
	console.log('📜 Building typescripts...');
	for await (const file of fs.expandGlob('./src/scripts/**/index.ts')) {
		const destinationPath = path.relative('./src/scripts', file.path);
		if (destinationPath.includes('/')) {
			const directoryPath = path.dirname(destinationPath);
			await ensureDir(`./dist/scripts/${directoryPath}`);
		}

		const bundled = await bundle(file.path);

		await Deno.writeTextFile(
			`./dist/scripts/${destinationPath.replace('.ts', '.js')}`,
			bundled.code,
		);
	}
}

const siteInfo = await parse();

const builders: {
	[key: string]: (siteInfo: SiteInfo) => Promise<void>;
	styles: () => Promise<void>;
	scripts: () => Promise<void>;
	files: () => Promise<void>;
} = {
	posts: buildPosts,
	pages: buildPages,
	tags: buildTagPages,
	styles: buildStyles,
	scripts: buildScripts,
	typescripts: buildTypeScripts,
	files: buildFiles,
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
