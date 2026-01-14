/* global CMS */
(function () {
  console.log("Sveltia CMS loaded.");

  // Custom previews are disabled as requested.
  // Preview pane is now disabled via config.yml (editor: preview: false).

  // Initialize
  if (window.CMS) {
    CMS.init();
  }
})();