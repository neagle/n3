import { IConfig, ICoordinates } from './Pond.ts';
import { coinFlip, easing, namespaced } from './utils.ts';

// How long the bursts of different flight paths for the fly should be
const FLY_FLIGHT_DISTANCE = 300;
// How much does each level increase the distance the fly travels with each swoop?
const DISTANCE_INCREMENT = 20;

interface IFly {
	parent: SVGGElement;
	config: IConfig;
	initialPosition?: ICoordinates;
	// The higher-level the fly is, the faster it moves
	level: number;
}

class Fly {
	public elem: SVGGElement;
	public flightPath: SVGPathElement;
	public caught: boolean = false;
	public level: number;

	private config: IConfig;

	private animationFrameRequest: number;
	private anchor: ICoordinates;
	private positionOffset: ICoordinates = { x: 0, y: 0 };

	private facing: 'left' | 'right' = 'left';

	constructor({ parent, config, initialPosition, level = 1 }: IFly) {
		this.config = config;
		this.level = level;

		/* tslint:disable:object-literal-sort-keys */
		this.elem = namespaced('g', 'hl-fly face-left', {
			fill: '#7A8387',
		}) as SVGGElement;

		this.elem.appendChild(
			namespaced('ellipse', 'body', {
				cx: '561.8',
				cy: '394.9',
				rx: '8.6',
				ry: '5.4',
			}),
		);

		this.elem.appendChild(
			namespaced('path', 'right-wing', {
				opacity: '.42',
				d: 'M563.8 389.7c1.5 3.4 1.2 6.6-.6 7.1-1.9.5-4.6-1.9-6.1-5.3s-1.2-6.6.6-7.1c1.9-.5 4.6 1.8 6.1 5.3z',
			}),
		);
		this.elem.appendChild(
			namespaced('path', 'left-wing', {
				opacity: '.42',
				d: 'M569 391.1c-.9 3.3-3.6 5.6-5.9 5.2-2.3-.4-3.5-3.4-2.5-6.6.9-3.3 3.6-5.6 5.9-5.2 2.3.4 3.4 3.4 2.5 6.6z',
			}),
		);
		this.elem.appendChild(
			namespaced('ellipse', 'head', {
				cx: '553.3',
				cy: '393.7',
				rx: '3.8',
				ry: '3.7',
			}),
		);
		/* tslint:enable:object-literal-sort-keys */

		parent.appendChild(this.elem);

		if (!initialPosition) {
			// Find a random initial position on the left or right
			const { top, right, bottom, left } = this.config.svg;
			const { width } = this.elem.getBBox();
			let visibleTop = config.visibleHeight || top;
			visibleTop = Math.max(top, visibleTop);

			initialPosition = {
				x: coinFlip() ? left - width / 2 : right + width / 2,
				y: Math.random() * (bottom - visibleTop) + visibleTop,
			};
		}
		this.placeAt(initialPosition);
	}

	public startFlying = () => {
		/* tslint:disable:no-console */
		this.fly()
			.then(this.startFlying)
			.catch((error) => console.log(`%c ${error} `, 'color: green'));
		/* tslint:enable:no-console */
	};

	public fly(
		destination?: ICoordinates,
		// Move the fly at slightly randomized speeds to make it more
		// unpredictable... and annoying!
		duration: number = (Math.floor(Math.random() * 3) + 1) * 1000,
	) {
		return new Promise((resolve, reject) => {
			// Interrupt the fly if it's already flying somewhere
			cancelAnimationFrame(this.animationFrameRequest);

			const startingPosition = this.getPosition();
			const anchor = this.anchor || startingPosition;

			if (!destination) {
				destination = this.pickRandomDestination(startingPosition);
			}

			const distance = {
				x: Math.abs(destination.x - startingPosition.x),
				y: Math.abs(destination.y - startingPosition.y),
			};

			// This anchor pulls the flight path in a curve
			const newAnchor: ICoordinates = {
				x: Math.floor(Math.random() * distance.x) + startingPosition.x,
				y: Math.floor(Math.random() * distance.y) + startingPosition.y,
			};

			const flightPath = this.getFlightPath();
			flightPath.setAttributeNS(null, 'fill', 'transparent');

			flightPath.setAttributeNS(
				null,
				'd',
				`
        M ${startingPosition.x} ${startingPosition.y}
        C ${anchor.x} ${anchor.y}, ${newAnchor.x} ${newAnchor.y}, ${destination.x} ${destination.y} 
        `,
			);

			this.anchor = newAnchor;

			const pathLength = flightPath.getTotalLength();

			let startTime: number;
			const step = (timeStamp = new Date().getTime()) => {
				const runTime = timeStamp - startTime;

				let progress = runTime / duration;
				progress = easing.easeInOutQuad(Math.min(progress, 1));

				const position = flightPath.getPointAtLength(pathLength * progress);

				this.faceTheRightWay(
					flightPath.getPointAtLength(pathLength * (progress - 0.01)),
					position,
				);

				this.placeAt(position);

				if (runTime < duration) {
					if (this.caught) {
						reject('🐸💬 DELICIOUS!');
					} else {
						this.animationFrameRequest = requestAnimationFrame(step);
					}
				} else {
					resolve();
				}
			};

			this.animationFrameRequest = requestAnimationFrame((timeStamp) => {
				startTime = timeStamp || new Date().getTime();
				step(timeStamp);
			});
		});
	}

	public placeAt(position: ICoordinates): void {
		const originalPosition = this.getOriginalPosition();

		const offset = {
			x: position.x - originalPosition.x,
			y: position.y - originalPosition.y,
		};

		this.positionOffset = offset;

		this.elem.style.transform = `translate(
      ${offset.x.toFixed(2)}px,
      ${offset.y.toFixed(2)}px
    )`;
	}

	public getPosition(): ICoordinates {
		const { x, y } = this.getOriginalPosition();

		return { x: x + this.positionOffset.x, y: y + this.positionOffset.y };
	}

	private getFlightPath(): SVGPathElement {
		if (!this.flightPath) {
			this.flightPath = namespaced('path', 'hl-flight-path') as SVGPathElement;
		}

		const parent = this.elem.parentNode;

		if (!parent) {
			throw new Error('No parent to which to attach our flight path!');
		}

		parent && parent.appendChild(this.flightPath);

		return this.flightPath;
	}

	// Face the fly in the right direction
	private faceTheRightWay(
		startingPosition: ICoordinates,
		destination: ICoordinates,
	): void {
		const { elem } = this;

		if (startingPosition.x > destination.x) {
			if (this.facing !== 'left') {
				this.facing = 'left';
				elem.classList.remove('face-right');
				elem.classList.add('face-left');
			}
		} else {
			if (this.facing !== 'right') {
				this.facing = 'right';
				elem.classList.remove('face-left');
				elem.classList.add('face-right');
			}
		}
	}

	private getOriginalPosition(): ICoordinates {
		const { width, height, x, y } = this.elem.getBBox();
		return { x: x + width / 2, y: y + height / 2 };
	}

	private pickRandomDestination(startingPosition: ICoordinates): ICoordinates {
		const {
			svg: { top, right, bottom, left },
			visibleHeight,
		} = this.config;
		const flightDistance = FLY_FLIGHT_DISTANCE +
			DISTANCE_INCREMENT * this.level;
		const range = flightDistance - flightDistance / 2;

		const moveX = Math.floor(Math.random() * range);
		const moveY = Math.floor(Math.random() * range);

		let x = startingPosition.x + moveX;
		let y = startingPosition.y + moveY;

		const visibleTop = visibleHeight ? Math.max(top, visibleHeight) : top;

		if (x > right || x < left) {
			x = startingPosition.x + moveX * -1;
		}

		if (y > bottom || y < visibleTop) {
			y = startingPosition.y + moveY * -1;
		}

		return { x, y };
	}
}

export default Fly;
