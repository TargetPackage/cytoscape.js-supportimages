export function extend() {
  // Variables
  let deep = false;
  let i = 0;
  const length = arguments.length;

  // Check if a deep merge
  if (Object.prototype.toString.call(arguments[0]) === "[object Boolean]") {
    deep = arguments[0];
    i++;
  }

  let extended = arguments[i] || {};
  i++;

  // Merge the object into the extended object
  const merge = function (obj) {
    for (const prop in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, prop)) {
        // If deep merge and property is an object, merge properties
        if (
          deep &&
          Object.prototype.toString.call(obj[prop]) === "[object Object]"
        ) {
          extended[prop] = extend(true, extended[prop], obj[prop]);
        } else {
          extended[prop] = obj[prop];
        }
      }
    }
  };

  // Loop through each object and conduct a merge
  for (; i < length; i++) {
    const obj = arguments[i];
    merge(obj);
  }

  return extended;
}

// Rectangle class
export function Rectangle(props) {
  if (props === undefined && this instanceof Rectangle) {
    return new Rectangle({
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    });
  }
  // Allow instantiation without the 'new' keyword
  if (!(this instanceof Rectangle)) {
    return new Rectangle(props);
  }

  // Put explicitly provided properties onto the object
  if (props) {
    extend(this, props);
  }

  this.x = this.x || 0;
  this.y = this.y || 0;
}

Rectangle.prototype.containsPoint = function (x, y) {
  return (
    x >= this.x &&
    x <= this.x + this.width &&
    y >= this.y &&
    y <= this.y + this.height
  );
};

Rectangle.prototype.set = function (x, y, w, h) {
  this.x = x;
  this.y = y;
  this.width = w;
  this.height = h;
};

Rectangle.prototype.equals = function (rect) {
  return (
    this.x === rect.x &&
    this.y === rect.y &&
    this.width === rect.width &&
    this.height === rect.height
  );
};
