import debounce from "./debounce.js";
import { extend, Rectangle } from "./rectangle.js";
import SupportImageCanvasRenderer from "./SupportImageCanvasRenderer.js";
import SupportImage from "./SupportImage.js";

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
            cy.trigger("cysupportimages.imagemoved", [evtState.image, b1, b2]);
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

        const factorX = evtState.imageState.width / evtState.imageState.height;
        const factorY = evtState.imageState.height / evtState.imageState.width;

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

        let newBoundX, newBoundY;
        switch (control.id) {
          case "tl":
            if (keepAspectRatio) {
              const d =
                dx > 0 ? Math.max(dx, dy) : dx < 0 ? Math.min(dx, dy) : dy;
              const fx = d === dx ? 1 : factorX;
              const fy = d === dy ? 1 : factorY;

              dx = d * fx;
              dy = d * fy;
            }

            bounds.width -= keepAxis ? dx * 2 : dx;
            bounds.height -= keepAxis ? dy * 2 : dy;

            newBoundX = bounds.x + dx;
            newBoundY = bounds.y + dy;
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
                bounds.height > minimumImageSize ? newBoundY : limits.center.y;
              bounds.x =
                bounds.width > minimumImageSize ? newBoundX : limits.center.x;
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

              let newBoundX = bounds.x + dy * factorX * 0.5;
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
              const d =
                dx > 0 ? Math.max(dx, dy) : dx < 0 ? Math.min(dx, dy) : dy;
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
                bounds.height > minimumImageSize ? newBoundY : limits.center.y;
              bounds.x =
                bounds.width > minimumImageSize ? newBoundX : limits.center.x;
            }

            break;

          case "bl":
            if (keepAspectRatio) {
              const d =
                dx > 0 ? Math.max(dx, dy) : dx < 0 ? Math.min(dx, dy) : dy;
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
                bounds.height > minimumImageSize ? newBoundY : limits.center.y;
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
                bounds.height > minimumImageSize ? newBoundY : limits.center.y;
              bounds.x =
                bounds.width > minimumImageSize ? newBoundX : limits.center.x;
            }
            break;

          case "ml":
            newBoundX = bounds.x + dx;
            if (!keepAxis && newBoundX + boundPadding > limits.middleRight.x) {
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

export default SupportImageExtension;
