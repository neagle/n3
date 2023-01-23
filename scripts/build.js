import { promises as fs } from 'fs'
import frontMatter from 'front-matter'
import pug from 'pug'
import slugify from 'slugify'
import chalk from 'chalk'
import sass from 'sass'

console.log(`Let's build!`)

async function createDist() {
	await fs.rmdir('./dist', { recursive: true, force: true })
	await fs.mkdir('./dist', { recursive: true })
}

// Get all posts
async function getPosts() {
	console.log('-- GET POSTS --')
	const postFiles = await fs.readdir('./content/posts/')
	console.log('postFiles', postFiles)
	const posts = await Promise.all(postFiles.map((post) => getPostData(post)))
	console.log('posts', posts)
	return posts
}

async function getPostData(post) {
	console.log('-- GET POST DATA --')
	const postContent = frontMatter(
		await fs.readFile(`./content/posts/${post}`, 'utf8')
	)
	// const data = frontMatter(postContent)

	console.log('postContent', postContent)
	// console.log('data', data)

	const renderedPost = pug.renderFile('./templates/post.pug', {
		body: postContent.body,
		...postContent.attributes,
	})
	console.log('renderedPost', renderedPost)

	return [postContent, renderedPost]
}

async function buildPosts(posts) {
	console.log(chalk.cyan('Building posts...'))
	await Promise.all(
		posts.map(([data, html]) => {
			const filename = slugify(data.attributes.title, {
				lower: true,
				strict: true,
			})

			console.log(filename)

			return fs.writeFile(`./dist/${filename}.html`, html)
		})
	)
	console.log(chalk.cyan('...built!'))
}

function createStyles() {
	console.log('-- Create Styles --')
	const result = sass.compile('./static/styles/main.scss')
	console.log(result)
	fs.writeFile('./dist/main.css', result.css.toString())
}

createDist()

async function build() {
	await createDist()
	const posts = await getPosts()
	buildPosts(posts)
	createStyles()
}

build()
