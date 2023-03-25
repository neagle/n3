import dayjs from 'npm:dayjs@1.11.7';
import utc from 'npm:dayjs/plugin/utc.js';
import glob from 'npm:glob';
import { marked } from 'npm:marked';
import {
	extract as frontMatter,
	test as isFrontMatter,
} from 'https://deno.land/std@0.179.0/encoding/front_matter/any.ts';
import * as path from 'https://deno.land/std@0.179.0/path/mod.ts';
import { ParsedFile, ParsedFrontMatter, SiteInfo } from './types.ts';

// Use curly quotes
marked.setOptions({ gfm: true, breaks: true, smartypants: true });

dayjs.extend(utc);

// Get all posts
async function getPosts() {
	const postFiles = await glob('./src/content/posts/**/*.md', {
		ignore: './src/content/posts/**/comments/*.md',
	});

	return postFiles;
}

async function getPages() {
	const pageFiles = await glob('./src/content/pages/**/*.pug');
	return pageFiles;
}

async function getData(files: string[]) {
	const data = await Promise.all(
		files.map(async (file) => {
			const fileContent = await Deno.readTextFile(file);

			const parsedFrontMatter: ParsedFrontMatter = isFrontMatter(fileContent)
				? frontMatter(fileContent)
				: { frontMatter: '', body: fileContent, attrs: {} };

			let parsed: ParsedFile = {
				frontMatter: parsedFrontMatter.frontMatter,
				body: parsedFrontMatter.body,
				attributes: {
					...parsedFrontMatter.attrs,
				},
			};

			// Wrap dates in dayjs
			if (parsed.attributes.date instanceof Date) {
				parsed.attributes.date = dayjs(parsed.attributes.date).utc();
			}

			// If no date is set, use the file's birthtime
			if (!parsed.attributes.date) {
				const { birthtime } = await Deno.stat(file);
				parsed.attributes.date = dayjs(birthtime).utc();
			}

			let url = path.relative('./src/content', file);
			let destinationFile;

			// Is this a post or a page? Check the first directory
			const type = path.dirname(url).split(path.sep)[0].replace(/s$/, '');

			// Posts all have a directory named after them with an index.html
			if (type === 'post') {
				destinationFile = url;
				url = path.join('/', path.dirname(url));
			}

			// Pages don't have a prefix directory, they're just added to the root
			if (type === 'page') {
				url = path.relative('./src/content/pages', file);
				const filepath = path.dirname(url).replace('.', '');
				const filename = path.basename(file, '.pug');
				const ext = parsed.attributes.extension || 'html';
				destinationFile = '/' + path.join(filepath, `${filename}.${ext}`);
				url = destinationFile
					// Index pages are served up without the index.html
					.replace('index.html', '');
			}
			// console.log('file, destinationFile, url', file, builtFile, url);

			const titleSlug = url.split('/').pop();

			parsed = {
				...parsed,
				titleSlug,
				file,
				destinationFile,
				link: url,
			};

			// If the file is a markdown file, parse it with marked
			if (path.extname(file) === '.md') {
				parsed = {
					...parsed,
					body: marked(parsed.body),
				};
			}

			const comments = await glob(`${path.dirname(file)}/comments/*.md`);

			const commentsData = await Promise.all(
				comments.map(async (comment) => {
					const parsedCommentFrontMatter: ParsedFrontMatter = frontMatter(
						await Deno.readTextFile(comment),
					);

					const parsedComment: ParsedFile = {
						frontMatter: parsedCommentFrontMatter.frontMatter,
						body: marked(parsedCommentFrontMatter.body),
						attributes: parsedCommentFrontMatter.attrs,
					};

					parsedComment.attributes.date = dayjs(parsedComment.attributes.date)
						.utc();

					return parsedComment;
				}),
			);

			parsed.comments = commentsData || [];

			return parsed;
		}),
	);

	return data;
}

function getTags(postsData: ParsedFile[]) {
	const tags = postsData.reduce((tagsData, post) => {
		if (Array.isArray(post.attributes.tags) && !post.attributes.unlisted) {
			post.attributes.tags.forEach((tag) => {
				if (!tagsData[tag]) {
					tagsData[tag] = [post];
				} else if (Array.isArray(tagsData[tag])) {
					tagsData[tag].push(post);
				}
			});
		}
		return tagsData;
	}, {} as Record<string, ParsedFile[]>);

	return tags;
}

export default async function getSiteInfo() {
	const postFiles = await getPosts();
	const pageFiles = await getPages();
	const posts = await getData(postFiles).then((posts) =>
		posts.sort((a, b) => {
			// Sort posts by date ascending
			return Number(b.attributes.date) - Number(a.attributes.date);
		})
	);

	const pages = await getData(pageFiles);
	const tags = await getTags(posts);

	// Not sure where to put these values yet
	const siteInfo: SiteInfo = {
		config: {
			author: {
				name: 'Nate Eagle',
				email: 'nate@nateeagle.com',
			},
			site: 'https://nateeagle.com',
		},
		postFiles,
		posts,
		pageFiles,
		pages,
		tags,
	};

	return siteInfo;
}
