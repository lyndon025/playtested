/* global CMS */
const ArticlePreview = ({ entry, widgetFor }) => {
  const title = entry.getIn(["data", "title"]) || "";
  const pubDate = entry.getIn(["data", "pubDate"]) || "";
  const description = entry.getIn(["data", "description"]) || "";
  const score = entry.getIn(["data", "score"]);
  const tags = (entry.getIn(["data", "tags"]) || []).toJS?.() || [];
  return `
    <article style="font-family: system-ui; line-height:1.5; padding:1rem;">
      <h1 style="margin:0 0 .25rem 0;">${title}</h1>
      <div style="opacity:.7; font-size:.9rem;">${pubDate}</div>
      <p>${description}</p>
      ${score ? `<div><strong>Score:</strong> ${score}</div>` : ""}
      ${tags.length ? `<div><strong>Tags:</strong> ${tags.join(", ")}</div>` : ""}
      <hr />
      <div>${widgetFor("body")?.get("value") || ""}</div>
    </article>
  `;
};
class ArticlePreviewWidget extends window.createClass({
  render() {
    const html = ArticlePreview({ entry: this.props.entry, widgetFor: this.props.widgetFor });
    return window.h("div", { dangerouslySetInnerHTML: { __html: html } });
  },
}) {}
CMS.registerPreviewTemplate("article", ArticlePreviewWidget);
