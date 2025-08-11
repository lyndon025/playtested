/* global CMS */
const ArticlePreview = window.createClass({
  render() {
    const { entry, widgetFor } = this.props;

    const g = (path, fallback = "") => {
      const v = entry.getIn(path);
      return v === undefined || v === null ? fallback : v;
    };

    const title = g(["data", "title"]);
    const pubDate = g(["data", "pubDate"]);
    const description = g(["data", "description"]);
    const score = entry.getIn(["data", "score"]);
    const thumb = g(["data", "thumb"]);
    const tagsVal = entry.getIn(["data", "tags"]);
    const tags = tagsVal?.toJS ? tagsVal.toJS() : Array.isArray(tagsVal) ? tagsVal : [];
    const gallery = entry.getIn(["data", "gallery"]);
    const galleryArr = gallery?.toJS ? gallery.toJS() : Array.isArray(gallery) ? gallery : [];

    const bodyEl = widgetFor && widgetFor("body");

    return window.h(
      "article",
      { style: { fontFamily: "system-ui", lineHeight: 1.5, padding: "1rem" } },
      [
        title && window.h("h1", { style: { margin: "0 0 .25rem 0" } }, title),
        pubDate && window.h("div", { style: { opacity: 0.7, fontSize: ".9rem" } }, String(pubDate)),
        description && window.h("p", null, description),
        score != null && window.h("div", null, ["Score: ", String(score)]),
        tags.length > 0 && window.h("div", null, ["Tags: ", tags.join(", ")]),
        thumb && window.h("img", { src: thumb, alt: "Thumbnail", style: { maxWidth: "100%", borderRadius: "12px", margin: "8px 0" } }),
        galleryArr.length > 0 &&
          window.h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: "8px", margin: "8px 0" } },
            galleryArr.map((src, i) => window.h("img", { key: i, src, alt: "", style: { width: "100%", borderRadius: "8px" } }))
          ),
        window.h("hr"),
        bodyEl || window.h("div", null, "")
      ]
    );
  }
});

CMS.registerPreviewTemplate("article", ArticlePreview);
