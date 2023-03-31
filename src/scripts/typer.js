import { marked } from 'https://esm.sh/marked@4.3.0'
marked.setOptions({ breaks: true, smartypants: false })

function randomItem(array) {
	return array[Math.floor(Math.random() * array.length)]
}

let possibleCompletions

const generatePossibleCompletions = () => {
	possibleCompletions = []

	const addPossibleCompletion = (prefix, arr, confidentAtWord) => {
		possibleCompletions.push(
			randomItem(arr.map((item) => [`${prefix} ${item}`, confidentAtWord]))
		)
	}

	addPossibleCompletion(
		`Hi! I'm a`,
		[
			`dad`,
			`St. John's College alum`,
			`recovering 30 Rock addict`,
			`Smashing Pumpkins fan`,
			`poetry enthusiast`,
			`reformed prescriptivist`,
			`'90s rock kid`,
		],
		3
	)

	addPossibleCompletion(`Hi! I'm a`, [`webmaster`, `web designer`], 3)

	possibleCompletions.push([`Hi! I'm a web developer`, 4])

	addPossibleCompletion(
		`Hi! I'm a web developer & former`,
		[
			'camp counselor',
			'high school English teacher',
			'thespian',
			'MUD addict',
			'Rock Band guitar god',
			'Safeway helper clerk',
			'Peace Corps volunteer',
			'ping pong wizard',
		],
		6
	)

	addPossibleCompletion(
		`Hi! I'm a web developer & amateur`,
		[
			'philosopher',
			'tiki bartender',
			'movie critic',
			'tennis player',
			'go player',
		],
		7
	)

	addPossibleCompletion(
		`Hi! I'm a web developer & amateur cocktailer living in`,
		[
			'a van down by the river',
			'Charlottesville, VA',
			'Graham, WA',
			'Annapolis, MD',
			'Poli, Cameroon',
			'Alexandria, VA',
		],
		10
	)
}

const Typer = function (element) {
	const texts = Array.from(element.querySelectorAll('.text'))

	element.addEventListener('click', (event) => {
		if (event.target.classList.contains('restart')) {
			self.init(true)
		}
	})

	const self = {
		init: async function (override = false) {
			generatePossibleCompletions()

			// Only run this automatically on a first viewing, but allow an override to re-run it
			if (!override) {
				if (localStorage.getItem('introduced')) {
					texts.forEach((text) => {
						text.innerHTML = `<b>${marked(text.dataset.content)
							.replace(/<\/?p>/g, '')
							.replace(/ /g, '•')
							.trim()
							.replace(/•/g, ' ')}</b>`
					})
					texts.at(-1).innerHTML =
						texts.at(-1).innerHTML.trim() +
						'<b class="cursor">|</b> <a class="restart no-delay" title="Re-run Introduction">↻</a>'
					return
				} else {
					localStorage.setItem('introduced', true)
				}
			}

			// Sizer
			// This prevents the height from changing as the text is typed
			texts.forEach((text) => {
				text.innerHTML = marked(text.dataset.content)
			})
			const elementHeight = element.offsetHeight
			element.style.height = `${elementHeight}px`
			texts.forEach((text) => {
				text.innerHTML = ''
			})

			if (!override) {
				await new Promise((resolve) => setTimeout(resolve, 2000))
			}

			for (let i = 0; i < texts.length; i++) {
				texts[i].classList.add('typing')
				await type(
					texts[i],
					parseInt(texts[i].dataset.speed || 150, 10),
					i === texts.length - 1
				)
				await new Promise((resolve) => setTimeout(resolve, 2000))
				if (i < texts.length - 1) {
					texts[i].classList.remove('typing')
				}
			}
		},
	}

	self.init()

	return self
}

const type = function (
	element,
	delay,
	last = false,
	index = 1,
	resolve,
	previousPossibleCompletion
) {
	if (!resolve) {
		element.parentNode
			.querySelectorAll('.cursor')
			.forEach((cursor) => cursor.remove())
		return new Promise((resolve) => type(element, delay, last, index, resolve))
	}

	const content = element.dataset.content

	if (index <= content?.length) {
		const markdown = content.substring(0, index)
		const possibleCompletion = possibleCompletions.find(
			([completion, wordReached]) =>
				completion.includes(markdown) &&
				markdown.trim().split(' ').length === wordReached
		)

		const html = [
			`<b>${marked(markdown)
				.replace(/<\/?p>/g, '')
				.replace(/ /g, '•')
				.trim()
				.replace(/•/g, ' ')}</b>`,
		]

		html.push('<b class="cursor">|</b>')

		if (index === content.length && last) {
			html.push(' <a class="restart" title="Re-run Introduction">↻</a>')
			element.parentNode.style.height = 'auto'
		}

		if (possibleCompletion) {
			html.push(
				`<b class="possible-completion">${possibleCompletion[0].substring(
					markdown.length
				)}</b>`
			)
		}

		element.innerHTML = html.join('')
		index += 1

		let adjustedDelay = delay + (Math.random() * delay - delay / 2)

		if (markdown === 'Hi!') {
			adjustedDelay += 1000
		}

		// Pause when a new possible completion is suggested
		if (
			possibleCompletion &&
			(!previousPossibleCompletion ||
				previousPossibleCompletion[0] !== possibleCompletion[0])
		) {
			adjustedDelay += 500
		}

		setTimeout(
			() => type(element, delay, last, index, resolve, possibleCompletion),
			adjustedDelay
		)
	} else {
		resolve()
	}
}

const typer = document.querySelectorAll('.typer')

if (typer.length) {
	typer.forEach((typer) => Typer(typer))
}
