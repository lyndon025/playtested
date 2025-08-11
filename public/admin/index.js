/* global CMS */
if (window.CMS) {
  // Optional: pull in minimal typography for nicer previews
  // CMS.registerPreviewStyle("https://cdn.jsdelivr.net/npm/@tailwindcss/typography@0.5.9/dist/typography.min.css");

  const ArticlePreview = window.createClass({
    render() {
      const { entry, widgetFor } = this.props;
      const getIn = (path, fallback = "") => {
        const v = entry.getIn(path);
        return v === undefined || v === null ? fallback : v;
      };

      const title = getIn(["data", "title"]);
      const pubDate = getIn(["data", "pubDate"]);
      const description = getIn(["data", "description"]);
      const score = entry.getIn(["data", "score"]);
      const thumb = getIn(["data", "thumb"], "");
      const tagsVal = entry.getIn(["data", "tags"]);
      const tags = tagsVal && tagsVal.toJS ? tagsVal.toJS() : Array.isArray(tagsVal) ? tagsVal : [];

      const bodyEl = widgetFor && widgetFor("body");

      return window.h(
        "article",
        { style: { fontFamily: "system-ui", lineHeight: 1.5, padding: "1rem" } },
        [
          title && window.h("h1", { style: { margin: "0 0 .25rem 0" } }, title),
          pubDate && window.h("div", { style: { opacity: 0.7, fontSize: ".9rem" } }, String(pubDate)),
          description && window.h("p", null, description),
          (score ?? "") !== "" && window.h("div", null, ["Score: ", String(score)]),
          tags.length > 0 && window.h("div", null, ["Tags: ", tags.join(", ")]),
          thumb && window.h("img", { src: thumb, alt: "Thumbnail", style: { maxWidth: "100%", borderRadius: "12px", margin: "8px 0" } }),
          window.h("hr"),
          bodyEl || window.h("div", null, "")
        ]
      );
    }
  });

  CMS.registerPreviewTemplate("article", ArticlePreview);
}
