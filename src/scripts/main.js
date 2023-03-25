const commentForm = document.querySelector('.new-comment')

if (commentForm) {
	const submit = commentForm.querySelector('button[type="submit"]')
	const form = commentForm.querySelector('form')

	form.addEventListener('submit', async (event) => {
		event.preventDefault()

		// Clear existing messages
		commentForm.querySelectorAll('.message').forEach((message) => {
			message.remove()
		})

		const formData = new FormData(form)
		const data = JSON.stringify(Object.fromEntries(formData))

		const submitText = submit.textContent
		submit.textContent = submit.dataset.loading
		submit.disabled = true

		form.classList.add('submitting')

		const response = await fetch('/.netlify/functions/comment', {
			method: 'POST',
			body: data,
		})
		// const response = await new Promise((resolve) => {
		// 	setTimeout(() => {
		// 		resolve({
		// 			status: 400,
		// 			json: () => Promise.resolve({ message: 'ok' }),
		// 		})
		// 	}, 2000)
		// })

		const responseBody = await response.json()
		// console.log('response', response)
		// console.log('responseBody', responseBody)
		form.classList.remove('submitting')
		submit.textContent = submitText
		submit.disabled = false

		let newMessage
		if (response.status === 200) {
			newMessage = message(
				'Thanks for your comment! It should appear on the site in a few minutes.',
				'success'
			)
		} else if (response.status === 422) {
			newMessage = message(
				'There was a problem with your comment. It may have been flagged as spam.',
				'error'
			)
		} else {
			newMessage = message(
				'Something went wrong with your comment. There may be a service issue: my apologies!',
				'error'
			)
		}

		submit.after(newMessage)
	})

	const commentText = form.querySelector('.comment-text')
	const commentTextArea = commentText.querySelector('textarea')
	const commentTextHelp = form.querySelector('.comment-text-help')
	const markdownPreview = document.createElement('div')
	const showPreviewButton = document.createElement('button')
	showPreviewButton.innerText = 'Preview'
	showPreviewButton.classList.add('show-preview')
	const converter = new showdown.Converter()
	markdownPreview.classList.add('markdown-preview')
	commentTextHelp.append(showPreviewButton)
	commentTextArea.after(markdownPreview)

	commentText.addEventListener('keyup', (event) => {
		markdownPreview.innerHTML = converter.makeHtml(event.target.value)

		submit.disabled = event.target.value.length === 0
	})

	// Disable submit button if there's no text
	submit.disabled = commentTextArea.value.length === 0

	showPreviewButton.addEventListener('click', (event) => {
		event.preventDefault()
		showPreviewButton.classList.toggle('active')
		commentText.classList.toggle('show-preview')
	})

	function markLabel(element, value) {
		const label = element.closest('label')
		label.classList.toggle('has-value', value)
	}

	// form.addEventListener('keyup', (event) => {
	// 	const tag = event.target.tagName
	// 	if (tag === 'TEXTAREA' || tag === 'INPUT') {
	// 		markLabel(event.target, event.target.value)
	// 	}
	// })

	form
		.querySelectorAll('input[type="text"], input[type="email"], textarea')
		.forEach((input) => {
			input.addEventListener('focus', (event) => {
				markLabel(event.target, true)
			})
		})

	form
		.querySelectorAll('input[type="text"], input[type="email"], textarea')
		.forEach((input) => {
			input.addEventListener('blur', (event) => {
				markLabel(event.target, event.target.value)
			})
		})

	form
		.querySelectorAll('input[type="text"], input[type="email"]')
		.forEach((input) => {
			input.addEventListener('keyup', (event) => {
				const key = input.getAttribute('name')
				localStorage.setItem(key, input.value)
			})
		})

	form
		.querySelectorAll('input[type="text"], input[type="email"]')
		.forEach((input) => {
			const key = input.getAttribute('name')

			input.value = localStorage.getItem(key, input.value)
		})

	// Set has-value state on load
	form
		.querySelectorAll('input[type="text"], input[type="email"], textarea')
		.forEach((input) => {
			markLabel(input, input.value)
		})
}

function message(message, type = 'success') {
	const messageElement = document.createElement('div')
	messageElement.classList.add('message', type)
	messageElement.innerText = message
	return messageElement
}

/**
 * Add servings controls to recipe cards
 */
const recipe = document.querySelector('.recipe')

if (recipe) {
	const controls = document.createElement('div')
	controls.classList.add('controls')
	const plus = document.createElement('button')
	plus.innerText = '+'
	plus.classList.add('plus')
	const minus = document.createElement('button')
	minus.innerText = '-'
	minus.classList.add('minus')
	const servings = document.createElement('input')
	servings.value = 1
	servings.classList.add('servings')

	controls.append(minus)
	controls.append(servings)
	controls.append(plus)

	recipe.prepend(controls)

	const ingredients = recipe.querySelectorAll('.ingredients li')
	ingredients.forEach((ingredient) => {
		const quantity = ingredient.querySelector('.quantity')
		quantity.dataset.original = quantity.innerText.trim()
	})

	plus.addEventListener('click', (event) => {
		event.preventDefault()
		servings.value = parseInt(servings.value, 10) + 1
		updateQuantities()
	})

	minus.addEventListener('click', (event) => {
		event.preventDefault()
		servings.value = Math.max(parseInt(servings.value, 10) - 1, 1)
		updateQuantities()
	})

	servings.addEventListener('input', (event) => {
		updateQuantities()
	})
}

function updateQuantities() {
	const recipe = document.querySelector('.recipe')
	const servings = recipe.querySelector('.recipe .servings')
	const servingsValue = parseInt(servings.value, 10)

	if (!servingsValue) {
		return
	}

	const ingredients = recipe.querySelectorAll('.ingredients li')
	ingredients.forEach((ingredient) => {
		const quantity = ingredient.querySelector('.quantity')
		const unit = ingredient.querySelector('.unit')
		const original = getNumber(quantity.dataset.original)

		const newQuantity = original * servingsValue

		quantity.innerText = floatToFraction(newQuantity)

		// Pluralize or singularize unit
		const exceptions = ['oz']
		if (unit && !exceptions.includes(unit.innerText)) {
			unit.innerText =
				newQuantity <= 1
					? Inflector.singularize(unit.innerText)
					: Inflector.pluralize(unit.innerText)
		}
	})
}

function getNumber(quantity) {
	let num = quantity.split(/(?=[^\d])/)

	num = num.reduce((acc, cur) => {
		const current = cur
			.trim()
			.replace('⅛', '0.125')
			.replace('¼', '0.25')
			.replace('⅓', '0.33333')
			.replace('½', '0.5')
			.replace('⅔', '0.66666')
			.replace('¾', '0.75')

		return isNaN(parseFloat(current)) ? acc : acc + parseFloat(current)
	}, 0)

	return num
}

function floatToFraction(num) {
	const fractional = ['⅛', '¼', '⅓', '½', '⅔', '¾', '1']

	const fractionalValues = [
		1 / 8,
		1 / 4,
		1 / 3,
		1 / 2,
		2 / 3,
		3 / 4,
		1 / 3 + 1 / 3 + 1 / 3,
	]

	const decimal = num % 1
	const whole = Math.floor(num)
	let fraction = ''

	for (let i = 0; i < fractionalValues.length; i++) {
		if (Math.abs(decimal - fractionalValues[i]) < 0.0001) {
			fraction = fractional[i]
			break
		}
	}

	return `${whole > 0 ? whole + ' ' : ''}${fraction}`
}
