import { throttle } from 'https://esm.sh/throttle-debounce'

const getRotation = (event, skinViewer, rotate) => {
	const rect = skinViewer.getBoundingClientRect()

	// Get the x position of the skinViewer
	const originX = rect.left + (rect.right - rect.left) / 2

	// get the y position of the skinViewer
	const adjustmentForEyeLevel = rect.height / 6
	const originY = rect.top + adjustmentForEyeLevel

	const xAdjust = originX / window.innerWidth
	const yAdjust = originY / window.innerHeight

	const x = event.clientX / window.innerWidth - xAdjust
	const y = event.clientY / window.innerHeight - yAdjust
	const rotateX = y * rotate * -1
	const rotateY = x * rotate
	const rotateZ = x * y * (rotate / 2) * -1

	return `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`
}

const skinViewer = document.getElementById('skin-viewer')

const onMouseMove = throttle(20, (event) => {
	const head = skinViewer.querySelector('.head')
	skinViewer.style.transform = getRotation(event, skinViewer, 30)
	head.style.transform = getRotation(event, skinViewer, 40)
})

skinViewer.addEventListener('click', () => {
	if (!skinViewer.classList.contains('is-animating')) {
		skinViewer.classList.add('wave', 'is-animating')

		// Reference for wink behavior:
		// skinViewer.classList.add('wink', 'is-animating')
		// blink()
	}
})

// Remove the animation class when the animation ends
skinViewer.addEventListener('animationend', (event) => {
	skinViewer.classList.remove(event.animationName, 'is-animating')
})

let blinker
// Google says we blink about 12 times a minute
const blink = (delay = (1000 * 60) / 12) => {
	clearTimeout(blinker)
	blinker = setTimeout(() => {
		skinViewer.classList.add('blink', 'is-animating')
		blink()
	}, delay)
}

blink()

if (skinViewer) {
	setTimeout(() => {
		// Welcome people with a wave
		skinViewer.click()
		// Don't start responding to mouse movement until the wave is done
		skinViewer.addEventListener(
			'animationend',
			(event) => {
				if (event.animationName === 'wave') {
					document.addEventListener('mousemove', onMouseMove)
				}
			},
			{ once: true }
		)
	}, 1000)
}
