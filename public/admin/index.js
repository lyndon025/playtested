/* global CMS */

// Modern React functional component approach
const ArticlePreview = ({ entry, widgetFor, widgetsFor }) => {
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

  // Get the body widget
  const bodyEl = widgetFor && widgetFor("body");

  return CMS.h(
    "article",
    { 
      style: { 
        fontFamily: "system-ui", 
        lineHeight: 1.5, 
        padding: "1rem",
        maxWidth: "800px",
        margin: "0 auto"
      } 
    },
    [
      title && CMS.h("h1", { 
        style: { 
          margin: "0 0 .5rem 0", 
          fontSize: "2rem",
          fontWeight: "bold"
        } 
      }, title),
      
      pubDate && CMS.h("div", { 
        style: { 
          opacity: 0.7, 
          fontSize: ".9rem", 
          marginBottom: "1rem",
          color: "#666"
        } 
      }, new Date(pubDate).toLocaleDateString()),
      
      description && CMS.h("p", { 
        style: { 
          fontSize: "1.1rem", 
          marginBottom: "1rem",
          fontStyle: "italic"
        } 
      }, description),
      
      score !== undefined && score !== null && CMS.h("div", { 
        style: { 
          backgroundColor: "#f0f0f0", 
          padding: "0.5rem", 
          borderRadius: "4px",
          marginBottom: "1rem",
          fontWeight: "bold"
        } 
      }, `Score: ${score}/10`),
      
      tags.length > 0 && CMS.h("div", { 
        style: { 
          marginBottom: "1rem" 
        } 
      }, [
        CMS.h("strong", null, "Tags: "),
        tags.map((tag, index) => 
          CMS.h("span", {
            key: index,
            style: {
              backgroundColor: "#007acc",
              color: "white",
              padding: "0.2rem 0.5rem",
              margin: "0 0.2rem",
              borderRadius: "3px",
              fontSize: "0.8rem"
            }
          }, tag)
        )
      ]),
      
      thumb && CMS.h("img", { 
        src: thumb, 
        alt: "Thumbnail", 
        style: { 
          maxWidth: "100%", 
          borderRadius: "8px", 
          margin: "1rem 0",
          display: "block"
        } 
      }),
      
      CMS.h("hr", { style: { margin: "2rem 0" } }),
      
      CMS.h("div", {
        style: {
          lineHeight: 1.6,
          fontSize: "1rem"
        }
      }, bodyEl || CMS.h("div", null, "Content will appear here..."))
    ]
  );
};

// Register the preview template
CMS.registerPreviewTemplate("article", ArticlePreview);

console.log('✅ Article preview template registered');