import { extend, Rectangle } from "./rectangle.js";

// Support Image class
export default function SupportImage(core, props) {
  if (props === undefined && this instanceof SupportImage) {
    // called object.constructor();
    return new SupportImage(core, this.json());
  }

  function guid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  // Allow instantiation without the 'new' keyword
  if (!(this instanceof SupportImage)) {
    return new SupportImage(core, props);
  }
  if (typeof props === "string") {
    props = { url: props };
  }

  // Put explicitly provided properties onto the object
  if (props) {
    extend(this, props);
  }

  // Check if the image has a URL
  if (!this.url) {
    console.error("A SupportImage must have a URL set");
  }

  this._private = this._private || {};
  this._private.core = core;

  // create default variables
  if (this.bounds) {
    if (!(this.bounds instanceof Rectangle)) {
      this.bounds = new Rectangle(this.bounds);
    }
  } else {
    this.bounds = new Rectangle();
  }

  this.locked = this.locked === undefined ? false : this.locked;
  this.visible = this.visible === undefined ? true : this.visible;
  this.name = this.name || this.url;

  this.id = this.id || guid();
}

SupportImage.prototype.position = function () {
  return {
    x: this.bounds.x + this.bounds.width / 2,
    y: this.bounds.y + this.bounds.height / 2,
  };
};

SupportImage.prototype.renderedPosition = function () {
  const core = this._private.core;
  const r = core.renderer();

  const zoom = r.data.cy.zoom();
  const pan = r.data.cy.pan();

  let x = this.bounds.x;
  let y = this.bounds.y;
  x = x * zoom + pan.x;
  y = y * zoom + pan.y;

  const w = this.bounds.width * zoom;
  const h = this.bounds.height * zoom;

  return {
    x: x + w / 2,
    y: y + h / 2,
  };
};

SupportImage.prototype.selected = function (param) {
  if (param !== undefined) {
    this._private.selected = param;
  } else {
    return this._private.selected;
  }
};

SupportImage.prototype.dragging = function (param) {
  if (param !== undefined) {
    this._private.dragging = param;
  } else {
    return this._private.dragging;
  }
};

SupportImage.prototype.json = function () {
  return {
    id: this.id,
    url: this.url,
    name: this.name,
    locked: this.locked,
    visible: this.visible,
    bounds: {
      x: this.bounds.x,
      y: this.bounds.y,
      width: this.bounds.width,
      height: this.bounds.height,
    },
  };
};
