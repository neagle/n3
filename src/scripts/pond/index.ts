import Pond from './Pond.ts';
// import './Pond.scss';

// document.getElementById("app").innerHTML = `
// <h1>Hello Parcel!</h1>
// <div>
//   Look
//   <a href="https://parceljs.org" target="_blank" rel="noopener noreferrer">here</a>
//   for more info about Parcel.
// </div>
// `;

const App = document.getElementById('app');

const pond = new Pond(App);

pond.write(`
  <h1>
    <b class="error-code">418</b> Fly Catcher.
  </h1>
  <p>This was a game I created for our 404 page at a previous company, with SVG graphics created by <a href="https://www.linkedin.com/in/calie/">Calie Lillis</a>. Try to catch as many flies as you can: it gets harder the higher you go.</p>
`);
