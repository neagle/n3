import inquirer from 'inquirer'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import cheerio from 'cheerio'
import { promises as fs } from 'fs'
import slugify from 'slugify'
import dayjs from 'dayjs'

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
// console.dir(type)
const create = async (type) => {
	switch (type) {
		case 'bookmark':
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
					if (value) {
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
			await fs.writeFile(filename, bookmarkFrontmatter)

			console.log(`Bookmark created: ${filename}`)

			break
		default:
			console.log('We need to know what type of thing to create.')
	}
}

create(type)
