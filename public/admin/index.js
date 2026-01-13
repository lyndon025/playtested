/* global CMS */
(function () {
  console.log("Sveltia CMS loaded.");

  // Custom previews are disabled as requested.
  // Sveltia will fall back to its default preview (Body content only + Frontmatter fields).

  // Register basic preview styles to make the default view look decent
  if (window.CMS) {
    CMS.registerPreviewStyle(`
      :root { color-scheme: light dark; }
      body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.6; padding: 16px; }
      img { max-width: 100%; height: auto; }
    `);

    // Initialize
    CMS.init();
  }
})();