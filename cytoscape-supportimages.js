/*!
 * Cytoscape Support Images Plugin
 *
 * AUTHOR: Jhonatan da Rosa
 */
(function () {
  "use strict";

  const debounce = (function () {
    /**
     * lodash 3.1.1 (Custom Build) <https://lodash.com/>
     * Build: `lodash modern modularize exports="npm" -o ./`
     * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Available under MIT license <https://lodash.com/license>
     */
    /** Used as the `TypeError` message for "Functions" methods. */
    const FUNC_ERROR_TEXT = "Expected a function";

    /* Native method references for those with the same name as other `lodash` methods. */
    const nativeMax = Math.max, nativeNow = Date.now;

    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Date
     * @example
     *
     * _.defer(function(stamp) {
     *   console.log(_.now() - stamp);
     * }, _.now());
     * // => logs the number of milliseconds it took for the deferred function to be invoked
     */
    const now =
      nativeNow ||
      function () {
        return new Date().getTime();
      };

    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked. The debounced function comes with a `cancel` method to cancel
     * delayed invocations. Provide an options object to indicate that `func`
     * should be invoked on the leading and/or trailing edge of the `wait` timeout.
     * Subsequent calls to the debounced function return the result of the last
     * `func` invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
     * for details over the differences between `_.debounce` and `_.throttle`.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify invoking on the leading
     *  edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be
     *  delayed before it's invoked.
     * @param {boolean} [options.trailing=true] Specify invoking on the trailing
     *  edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
     *
     * // invoke `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }));
     *
     * // ensure `batchLog` is invoked once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * jQuery(source).on('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }));
     *
     * // cancel a debounced call
     * var todoChanges = _.debounce(batchLog, 1000);
     * Object.observe(models.todo, todoChanges);
     *
     * Object.observe(models, function(changes) {
     *   if (_.find(changes, { 'user': 'todo', 'type': 'delete'})) {
     *     todoChanges.cancel();
     *   }
     * }, ['delete']);
     *
     * // ...at some point `models.todo` is changed
     * models.todo.completed = true;
     *
     * // ...before 1 second has passed `models.todo` is deleted
     * // which cancels the debounced `todoChanges` call
     * delete models.todo;
     */
    function debounce(func, wait, options) {
      var args,
        maxTimeoutId,
        result,
        stamp,
        thisArg,
        timeoutId,
        trailingCall,
        lastCalled = 0,
        maxWait = false,
        trailing = true;

      if (typeof func !== "function") {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      wait = wait < 0 ? 0 : +wait || 0;
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = !!options.leading;
        maxWait =
          "maxWait" in options && nativeMax(+options.maxWait || 0, wait);
        trailing = "trailing" in options ? !!options.trailing : trailing;
      }

      function cancel() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (maxTimeoutId) {
          clearTimeout(maxTimeoutId);
        }
        lastCalled = 0;
        maxTimeoutId = timeoutId = trailingCall = undefined;
      }

      function complete(isCalled, id) {
        if (id) {
          clearTimeout(id);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (isCalled) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = undefined;
          }
        }
      }

      function delayed() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0 || remaining > wait) {
          complete(trailingCall, maxTimeoutId);
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      }

      function maxDelayed() {
        complete(trailing, timeoutId);
      }

      function debounced() {
        args = arguments;
        stamp = now();
        thisArg = this; // jshint ignore:line
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
            isCalled = remaining <= 0 || remaining > maxWait;

          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          } else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        } else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = undefined;
        }
        return result;
      }

      debounced.cancel = cancel;
      return debounced;
    }

    /**
     * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // Avoid a V8 JIT bug in Chrome 19-20.
      // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
      const type = typeof value;
      return !!value && (type === "object" || type === "function");
    }

    return debounce;
  })();

  const extend = function () {
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
  };

  // Rectangle class
  function Rectangle(props) {
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

  // Support Image class
  function SupportImage(core, props) {
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

    // Check if the image has url
    if (!this.url) {
      console.error("An Support Image must have a url set");
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

  function SupportImageCanvasRenderer(options) {
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

    if (
      canvasWidth === this.canvasWidth &&
      canvasHeight === this.canvasHeight
    ) {
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

  // Extension core
  const SupportImageExtension = (function () {
    // Helper function
    function bindEvent(supportImageExt, eventName, handler) {
      const cy = supportImageExt._private.cy;

      cy.on(eventName, function (evt) {
        if (evt.isPropagationStopped && evt.isPropagationStopped()) return;

        evt.supportImageExt = supportImageExt;
        const target = evt.cyTarget ? evt.cyTarget : evt.target;
        if (target !== evt.cy) {
          // is not the core
          return handler(evt);
        }

        const supportImages = supportImageExt.images();
        const resizeControls = supportImageExt.resizeControls();
        const pos = evt.cyPosition ? evt.cyPosition : evt.position;

        if (supportImageExt.selectedImage()) {
          for (let idx = 0, len = resizeControls.length; idx < len; ++idx) {
            const control = resizeControls[idx];
            if (control.containsPoint(pos.x, pos.y)) {
              return handler(evt, control);
            }
          }
        }

        for (let idx = 0, len = supportImages.length; idx < len; ++idx) {
          const image = supportImages[idx];
          if (image.locked || !image.visible) continue;
          if (image.bounds.containsPoint(pos.x, pos.y)) {
            return handler(evt, image);
          }
        }

        return handler(evt);
      });
    }

    function initRenderer(supportImageExt, options) {
      const cy = supportImageExt._private.cy;
      const container = cy.container();

      options = extend(
        { name: window && container ? "canvas" : "null" },
        options
      );

      const RendererProto = SupportImageCanvasRenderer;
      if (RendererProto == null) {
        console.error(
          "Can not initialise Support Image Extension: No such renderer `%s` found; did you include its JS file?",
          options.name
        );
        return;
      }

      supportImageExt._private.renderer = new RendererProto(
        extend({}, options, {
          supportImageExt: supportImageExt,
          cy: cy,
        })
      );

      // auto resize
      const r = supportImageExt._private.renderer;
      r.registerBinding(
        window,
        "resize",
        debounce(function (e) {
          r.invalidateContainerClientCoordsCache();
          r.matchCanvasSize(r.data.container);
          r.redraw();
        }, 100)
      );
    }

    function init(supportImageExt) {
      initRenderer.apply(null, [supportImageExt]);
      const cy = supportImageExt._private.cy;

      cy.on("load initrender", function () {
        supportImageExt.notify({ type: "load" });
      });
      cy.on("pan", function () {
        supportImageExt.notify({ type: "pan" });
      });
      cy.on("zoom", function () {
        const img = supportImageExt.selectedImage();
        if (img) {
          updateResizeControls(supportImageExt, img);
        }
        supportImageExt.notify({ type: "zoom" });
      });

      registerMouseHandlers.apply(null, [supportImageExt]);
    }

    function registerMouseHandlers(supportImageExt) {
      function getMousePosition(evt) {
        return evt.cyRenderedPosition
          ? evt.cyRenderedPosition
          : evt.renderedPosition;
      }

      const evtState = supportImageExt._private.evtState;

      function saveCytoscapeState(cy) {
        const cyState = {
          gabrifyEnabled: cy.autoungrabify(),
          unselectifyEnabled: cy.autounselectify(),
          boxSelectionEnabled: cy.boxSelectionEnabled(),
          userPanningEnabled: cy.userPanningEnabled(),
          panningEnabled: cy.panningEnabled(),
          selectedElements: cy.elements(":selected"),
        };

        evtState.cyState = cyState;
      }

      function restoreCytoscapeState(cy) {
        // Always restore if any
        if (evtState.cyState) {
          const cyState = evtState.cyState;
          cy.boxSelectionEnabled(cyState.boxSelectionEnabled);
          cy.userPanningEnabled(cyState.userPanningEnabled);
          cy.panningEnabled(cyState.panningEnabled);
          cy.autoungrabify(cyState.gabrifyEnabled);
          cy.autounselectify(cyState.unselectifyEnabled);
          cy.elements().each(function (i, ele) {
            if (cyState.selectedElements.anySame(ele)) {
              ele.select();
            }
          });

          // Restore just once
          evtState.cyState = null;
        }
      }

      bindEvent(supportImageExt, "mousedown", function (evt, item) {
        const cy = evt.cy;
        evtState.mouseDown = true;
        evtState.mousePosition = getMousePosition(evt);

        const isPanEnabled =
          cy.autoungrabify() &&
          cy.panningEnabled() &&
          (!cy.elements().selectable() ||
            cy.elements().selectable() === undefined);
        const isAreaZoomEnabled =
          cy.autoungrabify() &&
          !cy.panningEnabled() &&
          (!cy.elements().selectable() ||
            cy.elements().selectable() === undefined);

        if (item && !isPanEnabled && !isAreaZoomEnabled) {
          evt.stopPropagation();
          saveCytoscapeState(cy);

          cy.boxSelectionEnabled(false);
          cy.elements().unselect();
          cy.autoungrabify(true);
          cy.autounselectify(true);
          cy.userPanningEnabled(false);
          cy.panningEnabled(false);

          if (item instanceof SupportImage) {
            evt.supportImageExt.clearSelection();
            evtState.resizeControl = null;

            evt.supportImageExt.selectImage(item);
            item.dragging(true);
          } else if (item instanceof Rectangle) {
            // Resize control
            evtState.image = null;
            changePointerResizeControl(item.id);
            evtState.resizeControl = item;
            evtState.imageState = {
              width: evt.supportImageExt.selectedImage().bounds.width,
              height: evt.supportImageExt.selectedImage().bounds.height,
              x: evt.supportImageExt.selectedImage().bounds.x,
              y: evt.supportImageExt.selectedImage().bounds.y,
              ctrlKey: evt.originalEvent.ctrlKey,
              shiftKey: evt.originalEvent.shiftKey,
            };
          } else {
            console.error("Unknown object detected: " + item);
          }
          return false;
        } else {
          evt.supportImageExt.clearSelection();
          evtState.resizeControl = null;
        }
      });

      bindEvent(supportImageExt, "mouseup", function (evt, item) {
        const cy = evt.cy;
        evtState.mouseDown = false;
        evtState.mousePosition = getMousePosition(evt);
        changePointerResizeControl("");

        restoreCytoscapeState(cy);

        if (evtState.image) {
          evtState.image.dragging(false);
          if (evtState.imgBounds) {
            const b1 = evtState.imgBounds;
            const b2 = evtState.image.bounds;
            if (!b2.equals(b1)) {
              cy.trigger("cysupportimages.imagemoved", [
                evtState.image,
                b1,
                b2,
              ]);
            }
          }
        }
        if (evtState.resizeControl) {
          if (evtState.imgBounds) {
            const b1 = evtState.imgBounds;
            const img = supportImageExt.selectedImage();
            const b2 = img.bounds;
            if (!b2.equals(b1)) {
              cy.trigger("cysupportimages.imageresized", [img, b1, b2]);
            }
          }
        }
        evtState.image = null;
        evtState.resizeControl = null;
      });

      bindEvent(supportImageExt, "mousemove", function (evt, item) {
        // If not for resize event, it is only mouseover
        if (!evtState.resizeControl) {
          if (item instanceof Rectangle) {
            // Mouseover
            changePointerResizeControl(item.id);
          } else {
            // Mouseout
            changePointerResizeControl("");
          }
        }

        if (evtState.image && evtState.image.dragging()) {
          const lastMousePos = evtState.mousePosition;
          const currMousePos = getMousePosition(evt);
          const r = evt.supportImageExt._private.renderer;

          const p1 = r.projectIntoViewport(lastMousePos.x, lastMousePos.y);
          const p2 = r.projectIntoViewport(currMousePos.x, currMousePos.y);

          evtState.image.bounds.x += p2[0] - p1[0];
          evtState.image.bounds.y += p2[1] - p1[1];
          updateResizeControls(evt.supportImageExt, evtState.image);
          evt.supportImageExt.notify({ type: "position" });
        } else if (evtState.resizeControl) {
          const control = evtState.resizeControl;
          const lastMousePos = evtState.mousePosition;
          const currMousePos = getMousePosition(evt);
          const r = evt.supportImageExt._private.renderer;

          const p1 = r.projectIntoViewport(lastMousePos.x, lastMousePos.y);
          const p2 = r.projectIntoViewport(currMousePos.x, currMousePos.y);

          const selected = evt.supportImageExt.selectedImage();
          const bounds = selected.bounds;

          const keepAspectRatio = evt.originalEvent.ctrlKey;
          const keepAxis = evt.originalEvent.shiftKey;

          if (evtState.imageState.ctrlKey !== keepAspectRatio) {
            evtState.imageState.ctrlKey = keepAspectRatio;
            evtState.imageState.width = bounds.width;
            evtState.imageState.height = bounds.height;
            evtState.imageState.x = bounds.x;
            evtState.imageState.y = bounds.y;
          }

          if (evtState.imageState.shiftKey !== keepAxis) {
            evtState.imageState.shiftKey = keepAxis;
            evtState.imageState.width = bounds.width;
            evtState.imageState.height = bounds.height;
            evtState.imageState.x = bounds.x;
            evtState.imageState.y = bounds.y;
          }

          const factorX =
            evtState.imageState.width / evtState.imageState.height;
          const factorY =
            evtState.imageState.height / evtState.imageState.width;

          const dx = p2[0] - p1[0];
          const dy = p2[1] - p1[1];

          // 10 for Width or Height
          const minimumImageSize = control.width * 2;
          // size - 1 (from margin)
          const boundPadding = control.width * 2 - 1;

          const limits = findLimits(evt.supportImageExt, {
            x: evtState.imageState.x,
            y: evtState.imageState.y,
            h: evtState.imageState.height,
            w: evtState.imageState.width,
          });

          switch (control.id) {
            case "tl":
              if (keepAspectRatio) {
                const d = dx > 0 ? Math.max(dx, dy) : dx < 0 ? Math.min(dx, dy) : dy;
                const fx = d === dx ? 1 : factorX;
                const fy = d === dy ? 1 : factorY;

                dx = d * fx;
                dy = d * fy;
              }

              bounds.width -= keepAxis ? dx * 2 : dx;
              bounds.height -= keepAxis ? dy * 2 : dy;

              let newBoundX = bounds.x + dx;
              let newBoundY = bounds.y + dy;
              if (!keepAxis) {
                if (newBoundX + boundPadding > limits.bottomRight.x) {
                  newBoundX = limits.bottomRight.x - boundPadding;
                }
                bounds.x = newBoundX;

                if (newBoundY + boundPadding > limits.bottomRight.y) {
                  newBoundY = limits.bottomRight.y - boundPadding;
                }
                bounds.y = newBoundY;
              } else {
                bounds.y =
                  bounds.height > minimumImageSize
                    ? newBoundY
                    : limits.center.y;
                bounds.x = bounds.width > minimumImageSize ? newBoundX : limits.center.x;
              }

              break;

            case "tm":
              bounds.height -= keepAxis ? dy * 2 : dy;

              newBoundY = bounds.y + dy;
              if (bounds.height < minimumImageSize) {
                newBoundY = keepAxis
                  ? limits.center.y
                  : limits.bottomMiddle.y - boundPadding;
              }
              bounds.y = newBoundY;

              if (keepAspectRatio) {
                dy = keepAxis ? dy * 2 : dy;
                bounds.width -= dy * factorX;

                newBoundX = bounds.x + dy * factorX * 0.5;
                if (
                  bounds.width < minimumImageSize &&
                  bounds.height < minimumImageSize
                ) {
                  newBoundX = limits.bottomMiddle.x;
                }
                bounds.x = newBoundX;
              }

              break;

            case "tr":
              if (keepAspectRatio) {
                const d = dx > 0 ? Math.max(dx, dy) : dx < 0 ? Math.min(dx, dy) : dy;
                const fx = d === dx ? 1 : -factorX;
                const fy = d === dy ? 1 : -factorY;

                dx = d * fx;
                dy = d * fy;
              }

              bounds.width += keepAspectRatio && keepAxis ? dx * 2 : dx;
              bounds.height -= keepAxis ? dy * 2 : dy;

              newBoundX = bounds.x - (keepAspectRatio ? dx : dx * 0.5);
              newBoundY = bounds.y + dy;

              if (!keepAxis) {
                if (newBoundY + boundPadding > limits.bottomLeft.y) {
                  newBoundY = limits.bottomLeft.y - boundPadding;
                }
                bounds.y = newBoundY;
              } else {
                bounds.y =
                  bounds.height > minimumImageSize
                    ? newBoundY
                    : limits.center.y;
                bounds.x =
                  bounds.width > minimumImageSize ? newBoundX : limits.center.x;
              }

              break;

            case "bl":
              if (keepAspectRatio) {
                const d = dx > 0 ? Math.max(dx, dy) : dx < 0 ? Math.min(dx, dy) : dy;
                const fx = d === dx ? 1 : -factorX;
                const fy = d === dy ? 1 : -factorY;

                dx = d * fx;
                dy = d * fy;
              }

              bounds.width -= keepAxis ? dx * 2 : dx;
              bounds.height += keepAspectRatio && keepAxis ? dy * 2 : dy;

              newBoundX = bounds.x + dx;
              if (!keepAxis) {
                if (newBoundX + boundPadding > limits.topRight.x) {
                  newBoundX = limits.topRight.x - boundPadding;
                }
                bounds.x = bounds.x = newBoundX;
              } else {
                newBoundY = bounds.y - (keepAspectRatio ? dy : dy * 0.5);
                bounds.y =
                  bounds.height > minimumImageSize
                    ? newBoundY
                    : limits.center.y;
                bounds.x =
                  bounds.width > minimumImageSize ? newBoundX : limits.center.x;
              }

              break;

            case "bm":
              bounds.height += dy;

              if (keepAxis) {
                newBoundY = bounds.y - dy;
                bounds.height += dy;
                if (bounds.height < minimumImageSize) {
                  newBoundY = limits.center.y;
                }
                bounds.y = newBoundY;
              }

              if (keepAspectRatio) {
                dy = keepAxis ? dy * 2 : dy;

                newBoundX = bounds.x - dy * factorX * 0.5;
                if (newBoundX > limits.topMiddle.x) {
                  newBoundX = limits.topMiddle.x;
                }
                bounds.x = newBoundX;

                bounds.width += dy * factorX;
              }

              break;

            case "br":
              if (keepAspectRatio) {
                const d =
                  dx > 0 ? Math.max(dx, dy) : dx < 0 ? Math.min(dx, dy) : dy;
                const fx = d === dx ? 1 : factorX;
                const fy = d === dy ? 1 : factorY;

                dx = d * fx;
                dy = d * fy;
              }
              bounds.width += dx;
              bounds.height += dy;
              if (keepAxis) {
                newBoundX = bounds.x - dx * 0.5;
                newBoundY = bounds.y - dy * 0.5;
                bounds.y =
                  bounds.height > minimumImageSize
                    ? newBoundY
                    : limits.center.y;
                bounds.x =
                  bounds.width > minimumImageSize ? newBoundX : limits.center.x;
              }
              break;

            case "ml":
              newBoundX = bounds.x + dx;
              if (
                !keepAxis &&
                newBoundX + boundPadding > limits.middleRight.x
              ) {
                newBoundX = limits.middleRight.x - boundPadding;
              } else if (keepAxis && newBoundX > limits.center.x) {
                newBoundX = limits.center.x;
              }
              bounds.x = newBoundX;

              bounds.width -= keepAxis ? dx * 2 : dx;

              if (keepAspectRatio) {
                dx = keepAxis ? dx * 2 : dx;

                newBoundY = bounds.y + dx * factorY * 0.5;
                if (!keepAxis && newBoundY > limits.middleRight.y) {
                  newBoundY = limits.middleRight.y;
                } else if (keepAxis && newBoundY > limits.center.y) {
                  newBoundY = limits.center.y;
                }
                bounds.y = newBoundY;

                bounds.height -= dx * factorY;
              }
              break;

            case "mr":
              bounds.width += keepAxis ? dx * 2 : dx;
              if (keepAxis) {
                newBoundX = bounds.x - dx;
                if (bounds.width < minimumImageSize) {
                  newBoundX = limits.center.x - boundPadding / 2;
                }
                bounds.x = newBoundX;
              }
              if (keepAspectRatio) {
                dx = keepAxis ? dx * 2 : dx;
                newBoundY = bounds.y - dx * factorY * 0.5;
                if (newBoundY > limits.middleLeft.y) {
                  newBoundY = limits.middleLeft.y;
                }
                bounds.y = newBoundY;
                bounds.height += dx * factorY;
              }

              break;
          }

          bounds.width =
            bounds.width < minimumImageSize ? minimumImageSize : bounds.width;
          bounds.height =
            bounds.height < minimumImageSize ? minimumImageSize : bounds.height;

          updateResizeControls(evt.supportImageExt, selected);
          evt.supportImageExt.notify({ type: "resize" });
        }
        evtState.mousePosition = getMousePosition(evt);
      });
    }

    // Altering the CSS in this way because mouseover and mouseout are not triggered by cytoscape for elements of type `supportimage`
    // as the canvas is unique for the image and the controls, it is necessary to apply the CSS for everything or the body and perform the manual control
    // of addition and removal two same
    function changePointerResizeControl(control) {
      let cssCursor = "";
      switch (control) {
        case "tl":
          cssCursor = "nw-resize";
          break;
        case "tm":
          cssCursor = "n-resize";
          break;
        case "tr":
          cssCursor = "ne-resize";
          break;
        case "bl":
          cssCursor = "sw-resize";
          break;
        case "bm":
          cssCursor = "s-resize";
          break;
        case "br":
          cssCursor = "se-resize";
          break;
        case "ml":
          cssCursor = "w-resize";
          break;
        case "mr":
          cssCursor = "e-resize";
          break;
      }

      document.body.style.cursor = cssCursor;
    }

    function updateResizeControls(supportImageExt, supportImage) {
      const x = supportImage.bounds.x;
      const y = supportImage.bounds.y;
      const w = supportImage.bounds.width;
      const h = supportImage.bounds.height;

      let resizeControls = supportImageExt.resizeControls();
      let cw = 5 * (1 / supportImageExt._private.cy.zoom());
      let ch = 5 * (1 / supportImageExt._private.cy.zoom());
      if (cw < 5) cw = 5;
      if (ch < 5) ch = 5;

      // top-left
      resizeControls[0].set(x - cw / 2, y - ch / 2, cw, ch);
      // top-middle
      resizeControls[1].set(x + w / 2 - cw / 2, y - ch / 2, cw, ch);
      // top-right
      resizeControls[2].set(x + w - cw / 2, y - ch / 2, cw, ch);
      // bottom-left
      resizeControls[3].set(x - cw / 2, y + h - ch / 2, cw, ch);
      // bottom-middle
      resizeControls[4].set(x + w / 2 - cw / 2, y + h - ch / 2, cw, ch);
      // bottom-right
      resizeControls[5].set(x + w - cw / 2, y + h - ch / 2, cw, ch);
      // middle-left
      resizeControls[6].set(x - cw / 2, y + h / 2 - ch / 2, cw, ch);
      // middle-right
      resizeControls[7].set(x + w - cw / 2, y + h / 2 - ch / 2, cw, ch);
    }

    function findLimits(supportImageExt, imageInfo) {
      const x = imageInfo.x;
      const y = imageInfo.y;
      const h = imageInfo.h;
      const w = imageInfo.w;

      let cw = 5 * (1 / supportImageExt._private.cy.zoom());
      let ch = 5 * (1 / supportImageExt._private.cy.zoom());
      if (cw < 5) cw = 5;
      if (ch < 5) ch = 5;

      let limits = {
        bottomRight: {},
        bottomMiddle: {},
        bottomLeft: {},
        middleRight: {},
        middleLeft: {},
        topRight: {},
        topLeft: {},
        topBottom: {},
        center: {},
      };

      limits.bottomRight = { x: x + w - cw / 2, y: y + h - ch / 2 };
      limits.bottomMiddle = { x: x + w / 2 - cw / 2, y: y + h - ch / 2 };
      limits.bottomLeft = { x: x - cw / 2, y: y + h - ch / 2 };

      limits.middleRight = { x: x + w - cw / 2, y: y + h / 2 - ch / 2 };
      limits.middleLeft = { x: x - cw / 2, y: y + h / 2 - ch / 2 };

      limits.topRight = { x: x + w - cw / 2, y: y - ch / 2 };
      limits.topMiddle = { x: x + w / 2 - cw / 2, y: y - ch / 2 };
      limits.topLeft = { x: x - cw / 2, y: y - ch / 2 };

      limits.center = { x: x + w / 2 - cw / 2, y: y + h / 2 - ch / 2 };

      return limits;
    }

    function SupportImageExtension(options) {
      // Allow instantiation without the 'new' keyword
      if (!(this instanceof SupportImageExtension)) {
        return new SupportImageExtension(props);
      }

      const RESIZE_CONTROLS = 8;
      const baseControl = { x: 0, y: 0, width: 5, height: 5 };

      this._private = {
        supportImages: [],
        resizeControls: [],
        cy: options.cy,
        evtState: {},
      };

      const ids = ["tl", "tm", "tr", "bl", "bm", "br", "ml", "mr"];
      for (let i = 0; i < RESIZE_CONTROLS; i++) {
        this.resizeControls().push(
          new Rectangle(extend(baseControl, { id: ids[i] }))
        );
      }

      init.apply(null, [this]);
    }

    SupportImageExtension.prototype.load = function (json) {
      if (typeof json === "string") {
        json = JSON.parse(json);
      }

      if (json.images) {
        const imgs = json.images;
        for (let i = 0; i < imgs.length; i++) {
          const img = new SupportImage(this, imgs[i]);
          this.images().push(img);
        }

        if (json.selected) {
          const img = this.image(json.selected);
          this.selectImage(img);
        }
      }
    };

    SupportImageExtension.prototype.renderer = function () {
      return this._private.renderer;
    };

    SupportImageExtension.prototype.destroy = function () {
      this.renderer().destroy();
    };

    SupportImageExtension.prototype.rectangle = function (bounds) {
      return new Rectangle(bounds);
    };

    SupportImageExtension.prototype.render = function () {
      const img = this.selectedImage();
      if (img) {
        updateResizeControls(this, img);
      }
      this._private.renderer.notify({ type: "render" });
    };

    SupportImageExtension.prototype.resizeControls = function () {
      return this._private.resizeControls;
    };

    SupportImageExtension.prototype.images = function () {
      return this._private.supportImages;
    };

    SupportImageExtension.prototype.image = function (id) {
      const imgs = this.images();
      for (let idx = 0, len = imgs.length; idx < len; ++idx) {
        const image = imgs[idx];
        if (image.id === id) return image;
      }

      return null;
    };

    SupportImageExtension.prototype.notify = function (params) {
      const r = this._private.renderer;
      r.notify(params);
    };

    SupportImageExtension.prototype.addSupportImage = function (img, isCenter) {
      const supImg = new SupportImage(this, img);

      if (isCenter !== false) {
        // middle
        var viewportMiddlePos = {
          x: this._private.cy.extent().x1 + this._private.cy.extent().w / 2,
          y: this._private.cy.extent().y1 + this._private.cy.extent().h / 2,
        };

        // COMMENTED OUT THESE TWO LINES SO OUR SPECIFIED X AND Y IS THE POSITION OF IMAGES ON THE GRAPH
        // supImg.bounds.x = viewportMiddlePos.x;
        // supImg.bounds.y = viewportMiddlePos.y;
      }

      this.images().push(supImg);
      this._private.renderer.notify({ type: "add", supportImage: supImg });

      return supImg;
    };

    SupportImageExtension.prototype.removeSupportImage = function (img) {
      let imgs = this.images();
      const idx = imgs.indexOf(img);

      if (idx > -1) {
        imgs.splice(idx, 1);
      }

      this._private.renderer.notify({ type: "remove", supportImage: img });
    };

    SupportImageExtension.prototype.setImageLocked = function (img, locked) {
      img.locked = locked;
      img.selected(false);

      this._private.renderer.notify({ type: "changed", supportImage: img });
    };

    SupportImageExtension.prototype.setImageVisible = function (img, visible) {
      img.visible = visible;
      img.selected(false);

      this._private.renderer.notify({ type: "changed", supportImage: img });
    };

    SupportImageExtension.prototype.moveImageUp = function (img) {
      const imgs = this.images();
      for (let i = 1; i < imgs.length; i++) {
        const curr = imgs[i];
        if (curr.id === img.id) {
          imgs[i] = imgs[i - 1];
          imgs[i - 1] = curr;
          break;
        }
      }
      this._private.renderer.notify({ type: "changed", supportImage: img });
    };

    SupportImageExtension.prototype.moveImageDown = function (img) {
      const imgs = this.images();
      for (let i = 0; i < imgs.length - 1; i++) {
        const curr = imgs[i];
        if (curr.id === img.id) {
          imgs[i] = imgs[i + 1];
          imgs[i + 1] = curr;
          break;
        }
      }
      this._private.renderer.notify({ type: "changed", supportImage: img });
    };

    SupportImageExtension.prototype.selectedImage = function () {
      const imgs = this.images();

      for (let idx = 0, len = imgs.length; idx < len; ++idx) {
        const image = imgs[idx];
        if (image.selected()) return image;
      }
      return null;
    };

    SupportImageExtension.prototype.selectImage = function (img) {
      if (img.locked || !img.visible || img.selected()) return;

      const imgs = this.images();
      const cy = this._private.cy;

      for (let idx = 0, len = imgs.length; idx < len; ++idx) {
        const image = imgs[idx];
        const selected = image.selected();
        image.selected(false);
        image.dragging(false);
        if (selected) {
          cy.trigger("cysupportimages.imagedeselected", [image]);
        }
      }

      img.dragging(false);
      img.selected(true);
      updateResizeControls(this, img);
      this._private.renderer.notify({ type: "selection" });
      this._private.evtState.image = img;
      this._private.evtState.imgBounds = extend({}, img.bounds);
      cy.trigger("cysupportimages.imageselected", [img]);
    };

    SupportImageExtension.prototype.clearSelection = function () {
      const imgs = this.images();
      const cy = this._private.cy;

      for (let idx = 0, len = imgs.length; idx < len; ++idx) {
        const img = imgs[idx];
        const selected = img.selected();
        img.selected(false);
        img.dragging(false);
        if (selected) {
          cy.trigger("cysupportimages.imagedeselected", [img]);
        }
      }

      this._private.renderer.notify({ type: "selection" });
    };

    SupportImageExtension.prototype.json = function () {
      let imgs = [];
      const images = this.images();
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        imgs.push(img.json());
      }
      const selected = this.selectedImage();
      const selectedId = selected ? selected.id : undefined;
      return {
        selected: selectedId,
        images: imgs,
      };
    };

    return SupportImageExtension;
  })();

  // registers the extension on a cytoscape lib ref
  const register = function (cytoscape) {
    // can't register if cytoscape unspecified
    if (!cytoscape) return;

    // if you want a core extension
    cytoscape("core", "supportimages", function (options) {
      // could use options object, but args are up to you
      const cy = this;
      if (cy._private.supportImageCore) {
        return cy._private.supportImageCore;
      } else {
        options = options || {};
        options.cy = options.cy || cy;
        cy._private.supportImageCore = new SupportImageExtension(options);
        return cy._private.supportImageCore;
      }
    });
  };

  if (typeof module !== "undefined" && module.exports) {
    // expose as a commonjs module
    module.exports = register;
  }

  if (typeof define !== "undefined" && define.amd) {
    // expose as an amd/requirejs module
    define("cytoscape-supportimages", function () {
      return register;
    });
  }

  if (typeof cytoscape !== "undefined") {
    // expose to global cytoscape (i.e. window.cytoscape)
    register(cytoscape);
  }
})();
