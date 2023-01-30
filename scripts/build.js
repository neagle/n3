import { promises as fs } from 'fs'
import frontMatter from 'front-matter'
import pug from 'pug'
import chalk from 'chalk'
import sass from 'sass'
import asyncGlob from 'glob'
import util from 'util'
import path from 'path'
import { marked } from 'marked'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import asyncNcp from 'ncp'
import xmlEscape from 'xml-escape'

const { author, site } = JSON.parse(await fs.readFile('./package.json', 'utf8'))

const debugLevel = 2

const debug = (msg, level = 1) => {
	if (debugLevel > level) {
		console.log(msg)
	}
}

dayjs.extend(utc)

// Use curly quotes
marked.setOptions({ gfm: true, breaks: true, smartypants: true })

console.log(chalk.cyan('🛠️  BUILDING!'))

const glob = util.promisify(asyncGlob)
const ncp = util.promisify(asyncNcp)

async function createDist() {
	await fs.rm('./dist', { recursive: true, force: true })
	await fs.mkdir('./dist', { recursive: true })
}

// Get all posts
async function getPosts() {
	debug(chalk.yellow('GET POSTS'))

	const postFiles = await glob('./src/content/posts/*.md')
	return postFiles
}

async function buildPosts(postData) {
	debug(chalk.cyan('Building posts...'))
	await fs.mkdir(`./dist/posts`, { recursive: true })

	await Promise.all(
		postData.map((data) => {
			const renderedPost = pug.renderFile('./src/templates/post.pug', {
				body: data.body,
				...data.attributes,
				posts: postData,
				author,
				site,
			})

			return fs.writeFile(path.join('./dist', data.link), renderedPost)
		})
	)
	debug(chalk.cyan('...built!'))
}

async function getPages() {
	debug('GET PAGES')
	const pageFiles = await glob('./src/content/pages/**/*.pug')
	return pageFiles
}

async function getData(files) {
	const defaultData = {
		title: 'Untitled',
	}

	const data = await Promise.all(
		files.map(async (file) => {
			let parsed = frontMatter(await fs.readFile(file, 'utf8'))
			// console.log('parsed', parsed)

			// Apply defaults
			parsed.attributes = {
				...defaultData,
				...parsed.attributes,
			}

			parsed.attributes.date = dayjs(parsed.attributes.date).utc()

			// If no date is set, use the file's birthtime
			const { birthtime } = await fs.stat(file)
			if (!parsed.attributes.date) {
				parsed.attributes.date = birthtime
			}

			let url = path.relative('./src/content', file)
			// TODO: Fix this for pages, which can have different extensions
			url = path.join('/', path.dirname(url), path.parse(url).name + '.html')

			if (path.extname(file) === '.md') {
				parsed = {
					...parsed,
					body: marked(parsed.body),
					file: file,
					link: url,
				}
			}

			return parsed
		})
	)

	return data
}

// Build an object of tags and all the posts that have them
function getTags(postData) {
	const tags = postData.reduce((tagsData, post) => {
		if (post.attributes.tags && !post.attributes.unlisted) {
			post.attributes.tags.forEach((tag) => {
				if (!tagsData[tag]) {
					tagsData[tag] = [post]
				} else if (Array.isArray(tagsData[tag])) {
					tagsData[tag].push(post)
				}
			})
		}
		return tagsData
	}, {})

	return tags
}

async function buildPages(pages, { posts, tags }) {
	debug(chalk.cyan('Building pages...', pages))

	await Promise.all(
		pages.map(async (file) => {
			const pageContent = frontMatter(await fs.readFile(file, 'utf8'))
			// Replace the date with a dayjs object
			pageContent.attributes.date = dayjs(pageContent.attributes.date)

			const ext = pageContent.attributes.extension || 'html'

			const filename = path.basename(file, '.pug')
			const filepath = path.dirname(path.relative('./src/content/pages', file))

			const link = path
				.join('/', filepath, filename + `.${ext}`)
				// Index pages are served up without the index.html
				.replace('index.html', '')

			const destinationFile = path.resolve(
				'./dist/',
				filepath,
				`${filename}.${ext}`
			)

			debug('destinationFile', destinationFile)
			console.log('filename', filename)
			debug('filepath', filepath)

			console.log('tags', Object.keys(tags))
			// Construct an object of all the data we need to pass to the template
			const globals = {
				name: filename,
				link,
				posts,
				tags,
				...pageContent.attributes,
				author,
				site,
				utils: {
					xmlEscape,
				},
			}

			// console.log('globals', globals)

			let renderedPage
			if (pageContent.attributes.layout !== 'nil') {
				renderedPage = pug.renderFile('./src/templates/page.pug', {
					body: pug.render(pageContent.body, {
						...globals,
					}),
					...globals,
				})
			} else {
				renderedPage = pug.render(pageContent.body, {
					...globals,
				})
			}
			if (filepath !== '.') {
				await fs.mkdir(`./dist/${filepath}`, { recursive: true })
			}

			return fs.writeFile(destinationFile, renderedPage)
		})
	)
}

async function buildTagPages(tags) {
	Object.entries(tags).forEach(async ([tag, posts]) => {
		const tagPage = pug.renderFile('./src/templates/tag.pug', {
			tag,
			posts,
			author,
			site,
		})

		await fs.mkdir(`./dist/tag/${tag}`, { recursive: true })
		await fs.writeFile(`./dist/tag/${tag}/index.html`, tagPage)
	})
}

function createStyles() {
	debug('Create Styles')
	const result = sass.compile('./src/styles/main.scss')
	fs.writeFile('./dist/main.css', result.css.toString())
}

createDist()

async function build() {
	await createDist()

	const posts = await getPosts()
	const postData = (await getData(posts)).sort((a, b) => {
		return b.attributes.date - a.attributes.date
	})

	const tags = getTags(postData)

	// console.log('postData', postData)
	await buildPosts(postData, { tags })

	const pages = await getPages()
	// console.log('pages', pages);

	await buildPages(pages, { posts: postData, tags })

	await buildTagPages(tags)

	createStyles()

	// Copy files
	// TODO: This will need optimization / caching / etc
	await ncp('./src/files', './dist')
}

build()