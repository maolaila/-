import sanitizeHtml from "sanitize-html";

export function sanitizeRichText(input: string | null | undefined) {
  if (!input) {
    return "";
  }

  return sanitizeHtml(input, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "h2",
      "h3",
      "h4"
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"]
    },
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          href: attribs.href ?? "#",
          target: "_blank",
          rel: "noopener noreferrer"
        }
      })
    }
  });
}
