// Example for doing file migration

import { promises as fs } from 'fs'
import asyncGlob from 'glob'
import util from 'util'
import path from 'path'

const glob = util.promisify(asyncGlob)

// Get a list of all markdown files in this directory
const files = await glob('./*.md')
console.log('files', files)
files.forEach(async (file) => {
	const filename = path.basename(file, '.md')
	console.log('filename', filename)
	await fs.mkdir(`./${filename}`, { recursive: true })
	// move file to new directory
	await fs.rename(file, `./${filename}/index.md`)
})
