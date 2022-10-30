export default function SupportImageCanvasRenderer(options) {
  this.options = options;

  this.data = {
    cy: options.cy,
    supportImageExt: options.supportImageExt,
    container: options.cy.container(),
  };

  this.bindings = [];

  this.data.canvasContainer = document.createElement("div");
  this.data.canvasContainer.id = "support-image-extension-div";

  let containerStyle = this.data.canvasContainer.style;
  containerStyle.position = "absolute";
  containerStyle.zIndex = "0";
  containerStyle.overflow = "hidden";

  // insert as first element in the container
  const container = this.data.container;
  container.insertBefore(this.data.canvasContainer, container.childNodes[0]);

  this.data.canvas = document.createElement("canvas");
  this.data.context = this.data.canvas.getContext("2d");
  this.data.canvas.style.position = "absolute";
  this.data.canvas.setAttribute("data-id", "layer-support-image-extension");
  this.data.canvas.style.zIndex = "0";
  this.data.canvasContainer.appendChild(this.data.canvas);

  this.load();
}

// RENDERER
SupportImageCanvasRenderer.prototype.notify = function (params) {
  switch (params.type) {
    case "destroy":
      this.destroy();
      return;
  }

  if (params.type === "load" || params.type === "resize") {
    this.invalidateContainerClientCoordsCache();
    this.matchCanvasSize(this.data.container);
  }

  this.redraw();
};

SupportImageCanvasRenderer.prototype.destroy = function () {
  this.destroyed = true;

  for (let i = 0; i < this.bindings.length; i++) {
    const binding = this.bindings[i];
    const b = binding;

    b.target.removeEventListener(b.event, b.handler, b.useCapture);
  }
};

SupportImageCanvasRenderer.prototype.registerBinding = function (
  target,
  event,
  handler,
  useCapture
) {
  this.bindings.push({
    target: target,
    event: event,
    handler: handler,
    useCapture: useCapture,
  });

  target.addEventListener(event, handler, useCapture);
};

SupportImageCanvasRenderer.prototype.load = function () {
  this.invalidateContainerClientCoordsCache();
  this.matchCanvasSize(this.data.container);
};

SupportImageCanvasRenderer.prototype.projectIntoViewport = function (
  clientX,
  clientY
) {
  const offsets = this.findContainerClientCoords();
  const offsetLeft = offsets[0];
  const offsetTop = offsets[1];

  let x = clientX - offsetLeft;
  let y = clientY - offsetTop;

  x -= this.data.cy.pan().x;
  y -= this.data.cy.pan().y;
  x /= this.data.cy.zoom();
  y /= this.data.cy.zoom();
  return [x, y];
};

SupportImageCanvasRenderer.prototype.findContainerClientCoords = function () {
  const container = this.data.container;

  const bb = (this.containerBB =
    this.containerBB || container.getBoundingClientRect());

  return [bb.left, bb.top, bb.right - bb.left, bb.bottom - bb.top];
};

SupportImageCanvasRenderer.prototype.invalidateContainerClientCoordsCache =
  function () {
    this.containerBB = null;
  };

const isFirefox = typeof InstallTrigger !== "undefined";

SupportImageCanvasRenderer.prototype.getPixelRatio = function () {
  const context = this.data.context;

  const backingStore =
    context.backingStorePixelRatio ||
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio ||
    1;

  if (isFirefox) {
    // because ff can't scale canvas properly
    return 1;
  }

  return (window.devicePixelRatio || 1) / backingStore;
};

// Resize canvas
SupportImageCanvasRenderer.prototype.matchCanvasSize = function (container) {
  const data = this.data;
  const width = container.clientWidth;
  const height = container.clientHeight;
  const pixelRatio = this.getPixelRatio();
  const canvasWidth = width * pixelRatio;
  const canvasHeight = height * pixelRatio;

  if (canvasWidth === this.canvasWidth && canvasHeight === this.canvasHeight) {
    // Save cycles if nothing changed
    return;
  }

  // Resizing resets the style
  const canvasContainer = data.canvasContainer;
  canvasContainer.style.width = width + "px";
  canvasContainer.style.height = height + "px";
  const canvas = data.canvas;

  if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
  }

  this.canvasWidth = canvasWidth;
  this.canvasHeight = canvasHeight;
};

SupportImageCanvasRenderer.prototype.getCachedImage = function (
  supportImage,
  onLoad
) {
  const r = this;

  const imageCache = (r.imageCache = r.imageCache || {});
  const url = supportImage.url;
  const id = supportImage.id;

  if (imageCache[url] && imageCache[url].image) {
    return imageCache[url].image;
  } else if (imageCache[id] && imageCache[id].video) {
    return imageCache[id].video;
  }

  const video_exts = ["mp4", "webm", "ogg"];
  const isVideo = video_exts.indexOf(url.slice(-3)) > -1 ? true : false;

  if (isVideo) {
    const cache = (imageCache[id] = imageCache[id] || {});
    const video = (cache.video = document.createElement("video"));
    video.addEventListener("loadedmetadata", onLoad);
    video.src = url;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    return video;
  } else {
    const cache = (imageCache[url] = imageCache[url] || {});
    const image = (cache.image = new Image());
    image.addEventListener("load", onLoad);
    image.src = url;
    return image;
  }
};

SupportImageCanvasRenderer.prototype.redraw = function (options) {
  options = options || {};

  const forcedZoom = options.forcedZoom;
  const forcedPan = options.forcedPan;
  const r = this;
  const pixelRatio =
    options.forcedPxRatio === undefined
      ? this.getPixelRatio()
      : options.forcedPxRatio;
  const cy = r.data.cy;
  const supportImageExt = r.data.supportImageExt;

  const zoom = cy.zoom();
  let effectiveZoom = forcedZoom !== undefined ? forcedZoom : zoom;
  const pan = cy.pan();
  let effectivePan = {
    x: pan.x,
    y: pan.y,
  };

  if (forcedPan) {
    effectivePan = forcedPan;
  }

  // Apply pixel ratio
  effectiveZoom *= pixelRatio;
  effectivePan.x *= pixelRatio;
  effectivePan.y *= pixelRatio;

  function setContextTransform(context, clear) {
    context.setTransform(1, 0, 0, 1, 0, 0);

    if (clear === undefined || clear) {
      context.clearRect(0, 0, r.canvasWidth, r.canvasHeight);
    }

    context.translate(effectivePan.x, effectivePan.y);
    context.scale(effectiveZoom, effectiveZoom);

    if (forcedPan) {
      context.translate(forcedPan.x, forcedPan.y);
    }
    if (forcedZoom) {
      context.scale(forcedZoom, forcedZoom);
    }
  }

  const supportImages = supportImageExt.images() || [];

  const context = this.data.context;
  setContextTransform(context);

  for (let idx = supportImages.length - 1; idx >= 0; --idx) {
    const image = supportImages[idx];
    if (image.visible) {
      this.drawSupportImage(context, image);
    }
  }
};

SupportImageCanvasRenderer.prototype.drawResizeControls = function (context) {
  const supportImageExt = this.data.supportImageExt;

  context.beginPath();
  const resizeControls = supportImageExt.resizeControls();
  for (let i = 0; i < resizeControls.length; i++) {
    const control = resizeControls[i];
    context.rect(control.x, control.y, control.width, control.height);
  }

  context.fillStyle = "lightgray";
  context.fill();
  context.stroke();
};

SupportImageCanvasRenderer.prototype.drawSupportImage = function (
  context,
  supportImage
) {
  const r = this;

  // Get image, and if not loaded then ask to redraw when later loaded
  const img = this.getCachedImage(supportImage, function (evt) {
    const resource = evt.currentTarget;
    const w = resource.width;
    const h = resource.height;
    supportImage.resourceW = w;
    supportImage.resourceH = h;
    supportImage.bounds.width = supportImage.bounds.width || w;
    supportImage.bounds.height = supportImage.bounds.height || h;

    if (img.readyState >= 0) {
      img.addEventListener("canplaythrough", function () {
        img.play();
      });

      function animateFrames() {
        if (supportImage.selected()) {
          context.drawImage(
            img,
            supportImage.bounds.x,
            supportImage.bounds.y,
            supportImage.bounds.width,
            supportImage.bounds.height
          );
          context.beginPath();
          context.rect(
            supportImage.bounds.x,
            supportImage.bounds.y,
            supportImage.bounds.width,
            supportImage.bounds.height
          );
          context.stroke();
          r.drawResizeControls(context);
        } else {
          context.drawImage(
            img,
            supportImage.bounds.x,
            supportImage.bounds.y,
            supportImage.bounds.width,
            supportImage.bounds.height
          );
        }
        requestAnimationFrame(animateFrames);
      }

      animateFrames();
    }

    r.redraw();
  });

  if (img.complete) {
    if (!supportImage.bounds.width) {
      supportImage.bounds.width = img.width;
    }
    if (!supportImage.bounds.height) {
      supportImage.bounds.height = img.height;
    }
    const x = supportImage.bounds.x;
    const y = supportImage.bounds.y;
    const w = supportImage.bounds.width;
    const h = supportImage.bounds.height;
    context.drawImage(img, 0, 0, img.width, img.height, x, y, w, h);

    if (supportImage.selected()) {
      context.beginPath();
      context.rect(x, y, w, h);
      context.stroke();

      this.drawResizeControls(context);
    }
  }
};
