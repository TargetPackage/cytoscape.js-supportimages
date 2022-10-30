import SupportImageExtension from "./libs/SupportImageExtension.js";

/*!
 * Cytoscape Support Images Plugin
 *
 * AUTHOR: Jhonatan da Rosa
 */
(function () {
  "use strict";

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
