import inquirer from 'inquirer'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import cheerio from 'cheerio'
import { promises as fs } from 'fs'
import slugify from 'slugify'
import dayjs from 'dayjs'
import { exec } from 'child_process'

const argv = yargs(hideBin(process.argv)).argv

let type = argv.type
if (!type) {
	const answer = await inquirer.prompt([
		{
			type: 'list',
			name: 'type',
			message: 'What would you like to add?',
			choices: ['bookmark', 'post', 'page'],
		},
	])
	type = answer.type
}

console.log(`cool, let's add a ` + type)

const create = {
	bookmark: async () => {
		const { url } = await inquirer.prompt([
			{
				type: 'input',
				name: 'url',
				message: 'Bookmark URL?',
			},
		])

		let titleFromUrl
		let descriptionFromUrl
		try {
			const response = await fetch(url)
			const html = await response.text()
			const $ = cheerio.load(html)
			const title = $('title').text()
			console.log(`Title: ${title}`)
			if (title) {
				titleFromUrl = title
			}
			const description = $('meta[name="description"]').attr('content')
			console.log(`Description: ${description}`)
			if (description) {
				descriptionFromUrl = description
			}
		} catch (error) {
			console.log(error)
		}

		const { title } = await inquirer.prompt([
			{
				type: 'input',
				default: titleFromUrl,
				name: 'title',
				message: 'Bookmark title?',
				validate: (input) => (input.length > 0 ? true : 'Title is required'),
			},
		])

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
		])

		const newBookmark = {
			url,
			title,
			description,
			tags,
			source,
			date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
		}

		let bookmarkFrontmatter = `---\n`
		bookmarkFrontmatter += Object.entries(newBookmark)
			.reduce((arr, [key, value]) => {
				if (key === 'tags') {
					arr.push(yamlList(key, value))
				} else {
					arr.push(`${key}: ${value}`)
				}
				return arr
			}, [])
			.join('\n')
		bookmarkFrontmatter += `\n---`

		const filename =
			'./src/content/bookmarks/' +
			slugify(newBookmark.title, { lower: true, strict: true }) +
			'.md'
		if (await exists(filename)) {
			console.log(`File already exists with that name: ${filename}`)
		} else {
			await fs.writeFile(filename, bookmarkFrontmatter)
		}

		console.log(`Bookmark created: ${filename}`)
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
		])

		const newPost = {
			title,
			description,
			tags,
			date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
		}

		let frontmatter = `---\n`
		frontmatter += Object.entries(newPost)
			.reduce((arr, [key, value]) => {
				if (value) {
					if (key === 'tags') {
						arr.push(yamlList(key, value))
					} else {
						arr.push(`${key}: ${value}`)
					}
				}
				return arr
			}, [])
			.join('\n')
		frontmatter += `\n---`

		const filename =
			'./src/content/posts/' +
			slugify(newPost.title, { lower: true, strict: true }) +
			'.md'
		// check if filename already exists
		if (await exists(filename)) {
			console.log(`File already exists with that name: ${filename}`)
		} else {
			await fs.writeFile(filename, frontmatter)
			console.log(`Post created: ${filename}`)
			exec('code ' + filename)
		}
	},
}

const exists = async (filename) => {
	try {
		await fs.access(filename)
	} catch (error) {
		return false
	}

	return true
}

const yamlList = (key, value, indentation = '') => {
	return `${key}:\n- ${value
		.split(' ')
		.map((tag) => tag.trim())
		.join(`\n${indentation}- `)}`
}

create[type]()
