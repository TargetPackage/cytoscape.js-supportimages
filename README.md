# cytoscape-supportimages

## Description

A plugin that enables support images and videos on cytoscape.js. Supported video types are mp4, webm, and ogg. -- [Demo](https://codepen.io/ninadpchaudhari/pen/rdWMJE)

Available functionalities:

- add image
- remove image
- list images
- set image height and width
- set image position
- change drawing order
- change visibility
- change locking (can be selected or moved)
- resize (shift pressed when resizing keeps the image center, ctrl pressed when resizing keeps the aspect ratio)

## Dependencies

- Cytoscape.js >= 2.3.8

## Usage instructions

Download the library:

- via npm: `npm install @targetpackage/cytoscape-supportimages`,
- via bower: `bower install @targetpackage/cytoscape-supportimages`, or
- via direct download in the repository (probably from a tag).

`require()` the library as appropriate for your project:

CommonJS:

```js
const cytoscape = require("cytoscape");
const supportimages = require("cytoscape-supportimages");

supportimages(cytoscape); // register extension
```

AMD:

```js
require(["cytoscape", "cytoscape-supportimages"], function (
  cytoscape,
  supportimages
) {
  supportimages(cytoscape); // register extension
});
```

Plain HTML/JS has the extension registered for you automatically, because no `require()` is needed.

## API

```js
// init/get the extension
const si = cy.supportimages();

// create rectangle object to set image position, width, and height
const bounds = si.rectangle({
  x: x,
  y: y,
  width: width,
  height: height,
});

// add a support image
si.addSupportImage({
  url: "yourimageurl",
  name: "yourimagename",
  bounds: bounds,
});

// list images
const imgs = si.images();

const myImg = imgs[0];

// set image locked
si.setImageLocked(myImg, true);

// set image visible
si.setImageVisible(myImg, false);

// move image up in the drawing order
si.moveImageUp(myImg);

// move image down in the drawing order
si.moveImageDown(myImg);

// remove image
si.removeSupportImage(myImg);
```
