import Fly from './Fly.ts';
import { easing, namespaced, newElement } from './utils.ts';

export interface ICoordinates {
	x: number;
	y: number;
}

export interface IConfig {
	// Make the box to hit the fly a little larger and therefore more forgiving
	hitBoxPadding: number;
	// SVG dimensions
	// The SVG will be scaled to the page, but *internally* it uses these coordinates
	svg: {
		bottom: number;
		left: number;
		right: number;
		top: number;
	};
	waterHeight: number;
	visibleHeight?: number;
}

class Pond {
	public elem: HTMLElement;
	public pond: HTMLDivElement;
	public caughtFliesScore: HTMLDivElement;
	public content: HTMLDivElement;
	public svg: SVGSVGElement;
	public landscape: SVGGElement;
	public landAndWater: SVGGElement;
	public lilyPads: SVGGElement;
	public lilyPad1: SVGGElement;
	public lilyPad2: SVGGElement;
	public flower: SVGGElement;
	public frog: SVGGElement;
	public tongue: SVGPathElement;
	public tonguePath: SVGGElement;
	public flies: Fly[] = [];
	public caughtFlies: Fly[] = [];
	public score: number = 0;

	private svgPoint: SVGPoint;

	private attacking: boolean = false;

	private config: IConfig = {
		hitBoxPadding: 15,
		svg: {
			bottom: 800,
			left: 0,
			right: 1184.6,
			top: 0,
		},
		waterHeight: 160,
	};

	private anglerFishMode: boolean = false;
	private cheatCode: number[] = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // konami code
	private cheatCodeIndex: number = 0;

	constructor(elem: HTMLElement) {
		this.pond = newElement('div', 'hl-pond') as HTMLDivElement;

		this.elem = elem;

		const { position } = this.elem.style;
		if (position !== 'absolute' && position !== 'relative') {
			// Make sure this elem anchors (so to speak) the SVG we'll attach to it, which will have position: absolute
			this.elem.style.position = 'relative';
		}

		this.elem.appendChild(this.pond);

		this.caughtFliesScore = newElement(
			'div',
			'caught-flies-score',
		) as HTMLDivElement;

		this.pond.appendChild(this.caughtFliesScore);

		this.createSVG();

		this.content = newElement('div', 'hl-pond-content') as HTMLDivElement;
		this.pond.appendChild(this.content);

		this.svg.addEventListener('click', this.attack);
		document.addEventListener('keyup', this.cheatCodeListener);

		this.config.visibleHeight = this.getVisibleHeight();

		this.addFly();
	}

	public destroy() {
		this.svg.removeEventListener('click', this.attack);
		document.removeEventListener('keyup', this.cheatCodeListener);
		this.elem.remove();
	}

	public write(content: string) {
		this.content.innerHTML = content;
	}

	private clickCoordinates(event: MouseEvent) {
		this.svgPoint.x = event.clientX;
		this.svgPoint.y = event.clientY;

		// The cursor point, translated into svg coordinates
		const ctm = this.svg.getScreenCTM() as DOMMatrix;
		const cursorPoint = this.svgPoint.matrixTransform(ctm.inverse());
		return cursorPoint;
	}

	private attack = (event: MouseEvent) => {
		// Prevent click spamming
		if (this.attacking) {
			return;
		}
		this.attacking = true;

		return new Promise((resolve, reject) => {
			const frog = this.frog.getBBox();
			const start = {
				x: frog.x + frog.width / 2,
				y: frog.y,
			};

			const end = this.clickCoordinates(event);

			if (this.anglerFishMode) {
				this.flies.forEach((fly) => fly.fly(end, 300));
			}

			this.tonguePath = namespaced('g') as SVGGElement;
			const path = namespaced('path') as SVGPathElement;

			path.setAttributeNS(null, 'fill', 'transparent');
			path.setAttributeNS(
				null,
				'd',
				`
          M ${start.x} ${start.y}
          L ${end.x} ${end.y}
        `,
			);

			this.tongue = namespaced('path') as SVGPathElement;
			this.tongue.setAttributeNS(null, 'fill', '#E974AB');
			this.tongue.setAttributeNS(null, 'stroke', '#E974AB');

			this.svg.appendChild(this.tongue);
			this.tonguePath.appendChild(path);

			this.elem.appendChild(this.tonguePath);

			const pathLength = path.getTotalLength();
			const duration = 0.3 * 1000;
			let startTime: number;
			let direction: string = 'out';

			const step = (timeStamp = new Date().getTime()) => {
				const runTime = timeStamp - startTime;

				let progress = runTime / duration;
				progress = direction === 'out' ? progress : 1 - progress;

				progress = easing.easeInOutQuad(Math.min(progress, 1));

				const position = path.getPointAtLength(pathLength * progress);

				this.drawTongue(position);

				if (direction === 'in') {
					this.caughtFlies.forEach((fly) => {
						fly.placeAt(position);
					});
				}

				if (runTime < duration) {
					requestAnimationFrame(step);
				} else {
					if (direction === 'out') {
						// Did we catch any flies?
						this.catchAnyFlies(position);

						direction = 'in';
						startTime = timeStamp || new Date().getTime();
						requestAnimationFrame(step);
					} else {
						this.attacking = false;
						this.tongue.remove();

						// If any flies were caught...
						if (this.caughtFlies.length) {
							this.caughtFlies.forEach((fly) => fly.elem.remove());
							this.caughtFlies = [];

							// If there aren't any more flies, advance to the next level
							if (this.flies.length === 0) {
								this.score += 1;
								this.caughtFliesScore.innerHTML = String(this.score);

								// Gradually increase the number of flies required to complete a level
								const fliesToAdd = Math.ceil(this.score / 4);

								// Stagger the addition of the new flies
								for (let i = 0; i < fliesToAdd; i += 1) {
									setTimeout(this.addFly.bind(this), 500 * (i + 1));
								}
							}
						}

						resolve();
					}
				}
			};

			requestAnimationFrame((timeStamp) => {
				startTime = timeStamp || new Date().getTime();

				step(timeStamp);
			});
		});
	};

	private cheatCodeListener = (event: KeyboardEvent) => {
		if (event.which === this.cheatCode[this.cheatCodeIndex]) {
			this.cheatCodeIndex += 1;

			if (this.cheatCodeIndex >= this.cheatCode.length) {
				/* tslint:disable:no-console */
				this.cheatCodeIndex = 0;
				this.anglerFishMode = true;
				console.log(
					'%c Angler-fish mode ACTIVATED',
					'color: white; background-color: blue; display: block;',
					'🎣',
				);
				setTimeout(() => {
					this.anglerFishMode = false;
					console.log(
						'%c It was fun while it lasted.',
						'color: white; background-color: blue; display: block;',
					);
				}, 10000);
				/* tslint:enable:no-console */
			}
		} else {
			this.cheatCodeIndex = 0;
		}
	};

	private catchAnyFlies(target: ICoordinates) {
		const { hitBoxPadding } = this.config;

		// Check all the flies and mark them if they've been caught
		this.flies.forEach((fly, i) => {
			const { width, height } = fly.elem.getBBox();
			const { x, y } = fly.getPosition();

			if (
				target.x > x - hitBoxPadding &&
				target.x < x + width + hitBoxPadding &&
				target.y > y - hitBoxPadding &&
				target.y < y + height + hitBoxPadding
			) {
				// Got it!
				fly.caught = true;
			}
		});

		// Sort caught / uncaught flies
		this.caughtFlies = this.flies.filter((fly) => fly.caught);
		this.flies = this.flies.filter((fly) => !fly.caught);

		if (this.caughtFlies.length > 1) {
			/* tslint:disable:no-console */
			console.log(
				'%c 💥 MULTI-KILL 💥',
				'color: white; background-color: #f58026; display: block;',
			);
			/* tslint:enable:no-console */
		}
	}

	private drawTongue(end: ICoordinates) {
		const frog = this.frog.getBBox();

		const start = {
			x: frog.x + frog.width / 2,
			y: frog.y,
		};

		const tongueWidth = 5;

		// Curve the frog's tongue a little
		let bend = 20;
		if (end.x < start.x) {
			bend *= -1;
		}

		const distance = { x: start.x - end.x, y: start.y - end.y };

		/// Draw the tongue
		this.tongue.setAttributeNS(
			null,
			'd',
			`
      M ${start.x} ${start.y} 
      S 
        ${start.x - distance.x / 2 - bend} ${start.y - distance.y / 2},
        ${end.x - tongueWidth / 2} ${end.y} 
      A ${tongueWidth / 3},${tongueWidth / 3} 0 1,1 ${end.x},${end.y}
      S 
        ${start.x - distance.x / 2 - bend} ${start.y - distance.y / 2},
        ${start.x} ${start.y}
      Z
    `,
		);
	}

	private addFly(position?: ICoordinates): Fly {
		const fly = new Fly({
			config: this.config,
			initialPosition: position,
			// Flies get harder to catch as player score goes up
			level: this.score,
			parent: this.landscape,
		});

		fly.startFlying();

		this.flies.push(fly);

		return fly;
	}

	private getVisibleHeight(): number {
		const { elem } = this;

		const { bottom, right } = this.config.svg;
		const ratio = elem.offsetWidth / elem.offsetHeight;

		// This uses that ratio to find what the visible cut-off is in terms of the
		// SVG's *internal* coordinates
		const visibleHeight = bottom - right / ratio;

		return visibleHeight;
	}

	private createSVG() {
		// We want to order keys logically, not alphabetically, when drawing SVG components
		/* tslint:disable:object-literal-sort-keys */
		const {
			waterHeight,
			svg: { left, top, right, bottom },
		} = this.config;

		this.svg = namespaced('svg', 'hl-pond-svg', {
			style:
				'position: absolute; left: 0; right: 0; bottom: 0; cursor: crosshair',
			viewBox: `${left} ${top} ${right} ${bottom}`,
		}) as SVGSVGElement;

		this.pond.appendChild(this.svg);

		this.landscape = namespaced('g', 'hl-pond-landscape') as SVGGElement;
		this.svg.appendChild(this.landscape);

		// Land and Water
		this.landAndWater = namespaced('g', 'hl-land-and-water') as SVGGElement;
		this.landscape.appendChild(this.landAndWater);

		const linearGradient = namespaced('linearGradient', '', {
			id: 'hl-pond-landscape-linear-gradient',
			gradientUnits: 'userSpaceOnUse',
			x1: '590.384',
			y1: '393.844',
			x2: '596.816',
			y2: '868.511',
		});

		linearGradient.appendChild(
			namespaced('stop', '', { offset: 0, 'stop-color': '#fff' }),
		);
		linearGradient.appendChild(
			namespaced('stop', '', { offset: 1, 'stop-color': '#999' }),
		);

		this.landAndWater.appendChild(linearGradient);

		this.landAndWater.appendChild(
			namespaced('path', '', {
				fill: 'url(#hl-pond-landscape-linear-gradient)',
				d: 'M1185.3 482.4L964 379.5 672 523.4l-79.4-97.7-83.1 59.2L381 326.7 276 442.4 0 211v428h1184.2z',
			}),
		);

		// Lighter water
		this.landAndWater.appendChild(
			namespaced('path', '', {
				fill: '#E3F2FC',
				d: `
          M ${left} ${bottom - waterHeight}
          L ${right} ${bottom - waterHeight}
          L ${right} ${bottom}
          L ${left} ${bottom}
          z
        `,
			}),
		);

		// Darker water
		this.landAndWater.appendChild(
			namespaced('path', '', {
				fill: '#D2E9F7',
				d: 'M445.1 757.4c13.8-42.1 317.6-19.2 317.6-19.2s274.5 11.5 211.8-20.1c38.8.1 210.5 0 210.5-7.7 0-6.9.7-53.1 0-71-4.7.1-18.6.2-35.8.3l-37.5.9c-12 4.9-134.7 10.6-134.7 10.6s-32.5 3.7-53.6 9.2c-21.1 5.6-48.7-2.2-48.7-2.2-49.8 24.9-120.8 24.6-145.8 23.5-1.8 9.2-29.8 16.6-64.2 16.6-31.7 0-58.1-6.3-63.3-14.5-.3.4-.6.8-1 1.2 0 14.8-34.6 26.8-77.2 26.8-23.3 0-44.2-3.6-58.3-9.3-.3.1-.5.1-.7.2-6.5 17.2-49.1 30.4-100.6 30.4-56.1 0-101.5-15.7-101.5-35 0-.8.1-1.6.2-2.4-2.9 1.8-35.9 21.7-85.7 33.1-52.2 11.9-75.2-9.4-75.2-9.4 1.4 20.7-84.2 24.9-101.4 25.5V800h395.9c20.9-8.4 42.4-21.9 49.2-42.6z',
			}),
		);

		// Trees shadow
		this.landAndWater.appendChild(
			namespaced('path', '', {
				fill: '#B8DDDD',
				d: 'M101.4 719.8s23 21.3 75.2 9.4c49.8-11.4 82.8-31.3 85.7-33.1-.2.8-.2 1.6-.2 2.4 0 19.3 45.4 35 101.5 35 51.6 0 94.2-13.3 100.6-30.4.3-.1.5-.1.7-.2 14.2 5.7 35 9.3 58.3 9.3 42.6 0 77.2-12 77.2-26.8.3-.4.6-.8 1-1.2 5.2 8.2 31.6 14.5 63.3 14.5 34.4 0 62.4-7.3 64.2-16.6 25 1 96 1.4 145.8-23.5 0 0 27.5 7.7 48.7 2.2 21.1-5.6 53.6-9.2 53.6-9.2s122.8-5.7 134.7-10.6L0 666.3v78.9c17.2-.6 102.7-4.7 101.4-25.4z',
			}),
		);

		// Shoreline
		this.landAndWater.appendChild(
			namespaced('path', '', {
				fill: '#7CA590',
				d: 'M1111.7 640.7l37.5-.9 35.4-.8H0v27.3z',
			}),
		);

		// Trees
		this.landAndWater.appendChild(
			namespaced('path', '', {
				fill: '#67CC9D',
				d: 'M1185 639.1c-.3-.2-1.2-.4-2.4-.7-4.1-.9-13-2.5-25-4.4-1.4-.2-2.8-.5-4.3-.7-67.6-10.7-218.7-31.7-218.7-31.7-25.5-8.1-94.6 9.6-94.6 9.6-3.1-16-74.6-49.5-97.2-45.3-6.5 1.2-11 2.7-14 4.3-12.5-13.2-37.1-22.1-65.4-22.1-31.6 0-58.6 11.2-69.3 26.9-2.7 1.7-4.9 3.1-6.4 4.1.6-2.8.9-5.7.9-8.7 0-29.7-30.5-53.8-68.2-53.8-25 0-46.8 10.6-58.7 26.3-18.5-20.7-54.7-34.8-96.5-34.8-46.6 0-86.4 17.5-102.2 42.3-14.9-20.4-66.2-49.5-117.5-58.5-53.2-9.4-62 28.5-62.3 30 .2-1 4.5-22.7-25.5-40.2-27.4-16-52.5-7.7-57.7-5.6v162.6c8.7 0 74.1.2 170.1.3h1014.6l-35.4.8c17.1-.1 28.6-.2 33.3-.3 1.4 0 2.2-.1 2.4-.1.3-.1.2-.2 0-.3z',
			}),
		);

		this.lilyPads = namespaced('g', 'hl-lily-pads') as SVGGElement;
		this.lilyPad2 = namespaced('g', 'hl-lily-pad2') as SVGGElement;

		this.landscape.appendChild(this.lilyPads);
		this.lilyPad2.appendChild(
			namespaced('path', '', {
				fill: '#50B583',
				d: 'M316 741.1c-7.4 0-14.8.8-22 2.6 1.3.8 2.7 1.8 4.1 2.8 7.4 5.3 12.8 10.5 12 11.7-.8 1.2-7.5-2.2-14.9-7.5-2.5-1.8-4.8-3.6-6.7-5.2l-2.1.7c-8.3 3.4-13.5 8.2-13.5 13.5 0 10.3 19.3 18.6 43.1 18.6s43.1-8.3 43.1-18.6c.1-10.3-19.2-18.6-43.1-18.6z',
			}),
		);

		this.lilyPad2.appendChild(
			namespaced('ellipse', '', {
				fill: '#35845B',
				cx: '315.5',
				cy: '762.2',
				rx: '25',
				ry: '5',
			}),
		);

		this.flower = namespaced('g', 'hl-flower') as SVGGElement;
		this.flower.appendChild(
			namespaced('path', '', {
				fill: '#DB5693',
				d: 'M313.6 760s-2-23.5 18.6-26.6c0 0 6.7 25.1-18.6 26.6z',
			}),
		);
		this.flower.appendChild(
			namespaced('path', '', {
				fill: '#D63E87',
				d: 'M313.3 732.1s-15.2 22.1 9.5 29.3c-.1 0 5.8-19-9.5-29.3z',
			}),
		);
		this.flower.appendChild(
			namespaced('path', '', {
				fill: '#DB4D8A',
				d: 'M303.5 732.9s-12.8 25.7 16.5 28.9c0 0 2.9-20.8-16.5-28.9z',
			}),
		);
		this.flower.appendChild(
			namespaced('path', '', {
				fill: '#DB4D8A',
				d: 'M309.2 760.4s-4.1-23.2 16.2-28.2c0 .1 8.8 24.5-16.2 28.2z',
			}),
		);
		this.flower.appendChild(
			namespaced('path', '', {
				fill: '#ED5DA5',
				d: 'M298.2 735.4s-10.7 27.2 21.5 26.5c0-.1.5-21.1-21.5-26.5z',
			}),
		);
		this.flower.appendChild(
			namespaced('path', '', {
				fill: '#ED5DA5',
				d: 'M309.9 764.1s-2-23.5 18.6-26.6c0-.1 6.7 25-18.6 26.6z',
			}),
		);
		this.flower.appendChild(
			namespaced('path', '', {
				fill: '#E974AB',
				d: 'M295.6 738.3s-10.7 27.2 21.5 26.5c0 0 .5-21.1-21.5-26.5z',
			}),
		);

		this.flower.appendChild(
			namespaced('path', '', {
				fill: '#E974AB',
				d: 'M313.7 764.2s2.7-24.8 24.9-23.9c0 .1 1.8 27.4-24.9 23.9z',
			}),
		);

		this.lilyPad1 = namespaced('g', 'hl-lily-pad1') as SVGGElement;
		this.lilyPad1.appendChild(
			namespaced('path', '', {
				fill: '#35845B',
				d: 'M381.1 743.5c-5.7 0-11.4-.5-16.9-1.6 1-.5 2.1-1.1 3.1-1.8 5.7-3.4 9.8-6.8 9.2-7.5-.6-.7-5.8 1.4-11.5 4.8-1.9 1.1-3.7 2.3-5.1 3.3l-1.6-.5c-6.4-2.1-10.4-5.2-10.4-8.6 0-6.6 14.8-11.9 33.1-12 18.3-.1 33.1 5.2 33.2 11.8 0 6.7-14.8 12-33.1 12.1z',
			}),
		);
		this.lilyPad1.appendChild(
			namespaced('path', '', {
				fill: '#5DC990',
				d: 'M381.6 743.2c-5.9 0-11.9-.5-17.7-1.7l3.3-1.8c6-3.5 10.2-7 9.6-7.7-.7-.8-6 1.5-12 5-2 1.2-3.8 2.4-5.3 3.4l-1.7-.5c-6.7-2.2-10.8-5.4-10.8-8.9 0-6.8 15.5-12.3 34.6-12.4 19.1-.1 34.6 5.4 34.7 12.2-.1 6.8-15.6 12.4-34.7 12.4z',
			}),
		);

		this.lilyPads.appendChild(this.lilyPad2);
		this.lilyPads.appendChild(this.lilyPad1);
		this.lilyPads.appendChild(this.flower);

		this.frog = namespaced('g', 'hl-frog') as SVGGElement;
		const ripples = namespaced('g', '') as SVGGElement;
		ripples.appendChild(
			namespaced('ellipse', '', {
				fill: 'none',
				stroke: '#D2E9F7',
				strokeWidth: '1.171',
				strokeMiterlimit: '10',
				cx: '863.4',
				cy: '757.6',
				rx: '14.7',
				ry: '1.8',
			}),
		);

		const frogHead = namespaced('g', '') as SVGGElement;
		frogHead.appendChild(
			namespaced('path', '', {
				fill: '#67CC9D',
				d: 'M864.3 752h-2.7c-6.4 0-7.7 5-7.7 5h19.4c-.8-4.8-9-5-9-5z',
			}),
		);
		frogHead.appendChild(
			namespaced('path', '', {
				fill: '#58BF8B',
				d: 'M860.4 752c-.2 0-.4.1-.6.1h-.2c-.3.1-.5.2-.5.4 0 .3 1.4.4 3 .2 1.4-.1 2.4-.7 2.8-.7h-4.5z',
			}),
		);
		/* tslint:enable:object-literal-sort-keys */

		this.landscape.appendChild(this.frog);
		this.frog.appendChild(ripples);
		this.frog.appendChild(frogHead);

		this.landscape.appendChild(this.frog);

		this.svgPoint = this.svg.createSVGPoint();
	}
}

export default Pond;
