const XMLNS = "http://www.w3.org/2000/svg";

// Create an SVG name-spaced element
const namespaced = (
  tag: string,
  className?: string,
  attributes?: { [s: string]: string | number }
) => {
  const elem = document.createElementNS(XMLNS, tag);

  if (className) {
    const classNames = className.split(" ");
    classNames.forEach(n => {
      elem.classList.add(n);
    });
  }

  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      elem.setAttributeNS(null, key, String(value));
    }
  }
  return elem;
};

const coinFlip = (): boolean => {
  return Math.round(Math.random()) === 1;
};

const newElement = (tagName: string, className?: string) => {
  const elem = document.createElement(tagName);
  if (className) {
    elem.classList.add(className);
  }
  return elem;
};

const easing = {
  // acceleration until halfway, then deceleration
  easeInOutQuad: (t: number) => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
};

export { coinFlip, easing, newElement, namespaced };
