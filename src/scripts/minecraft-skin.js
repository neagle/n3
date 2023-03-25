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
	skinViewer.style.transform = getRotation(event, skinViewer, 20)
	head.style.transform = getRotation(event, skinViewer, 30)
})

if (skinViewer) {
	document.addEventListener('mousemove', onMouseMove)
	skinViewer.style.backgroundImage = `url("/minecraft-skin/hurricane-nate-skin.png")`
}
