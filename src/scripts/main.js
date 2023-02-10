const commentForm = document.querySelector('.new-comment')

if (commentForm) {
	console.log('comment form found')
	const submit = commentForm.querySelector('input[type="submit"]')
	const form = commentForm.querySelector('form')

	form.addEventListener('submit', async (event) => {
		event.preventDefault()
		const formData = new FormData(form)
		const data = JSON.stringify(Object.fromEntries(formData))
		console.log('data', data)

		const response = await fetch('/.netlify/functions/comment', {
			method: 'POST',
			body: data,
		})

		const responseBody = await response.json()
		console.log('response', response)
		console.log('responseBody', responseBody)
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

	console.log('hey whole fambly!!!', markdownPreview)
	commentText.addEventListener('keyup', (event) => {
		markdownPreview.innerHTML = converter.makeHtml(event.target.value)
	})

	showPreviewButton.addEventListener('click', (event) => {
		event.preventDefault()
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
