import { DOMDocumentLike, DOMNodeLike } from "../../core/types/dom-like";

const ESCAPABLE_RE = /^[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]$/;
const AUTOLINK_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:[^<>\s]*$/;
const ALNUM_RE = /[A-Za-z0-9]/;

interface LinkMatch {
  label: string;
  href: string;
  end: number;
}

/** Parse `[label](href)` at `text[start]` (which must be `[`). */
function tryParseLink(text: string, start: number): LinkMatch | null {
  const labelEnd = text.indexOf("]", start + 1);
  if (labelEnd === -1 || text[labelEnd + 1] !== "(") return null;
  const label = text.slice(start + 1, labelEnd);
  if (label.includes("[") || label.includes("\n")) return null;
  const hrefEnd = text.indexOf(")", labelEnd + 2);
  if (hrefEnd === -1) return null;
  const inside = text.slice(labelEnd + 2, hrefEnd).trim();
  if (inside === "") return null;
  // Allow `href "title"` but reject other whitespace.
  if (/\s/.test(inside) && !/^<?\S+>?\s+"[^"]*"$/.test(inside)) return null;
  const href = inside.replace(/^<(.*)>$/, "$1").split(/\s+/)[0] as string;
  return { label, href, end: hrefEnd + 1 };
}

interface EmphasisToken {
  marker: string;
  tag: string;
  underscore: boolean;
}

/** Match an emphasis opener at position `i`, if any. */
function matchEmphasis(text: string, i: number, gfm: boolean): EmphasisToken | null {
  if (gfm && text.startsWith("~~", i)) return { marker: "~~", tag: "del", underscore: false };
  if (text.startsWith("**", i)) return { marker: "**", tag: "strong", underscore: false };
  if (text.startsWith("__", i)) return { marker: "__", tag: "strong", underscore: true };
  if (text[i] === "*") return { marker: "*", tag: "em", underscore: false };
  if (text[i] === "_") {
    // Single underscores inside words are literal (snake_case stays intact).
    if (i > 0 && ALNUM_RE.test(text[i - 1] as string)) return null;
    return { marker: "_", tag: "em", underscore: true };
  }
  return null;
}

/** Find the closing marker, skipping `_` closers inside words. */
function findEmphasisClose(text: string, from: number, token: EmphasisToken): number {
  let at = text.indexOf(token.marker, from);
  while (at !== -1 && token.underscore) {
    const next = text[at + token.marker.length];
    if (next === undefined || !ALNUM_RE.test(next)) return at;
    at = text.indexOf(token.marker, at + 1);
  }
  return at;
}

/**
 * Append `text` to `parent`, parsing inline markdown (code spans, emphasis,
 * links, images, autolinks, and GFM strikethrough when `gfm` is set).
 *
 * @param parent - Node receiving parsed inline content.
 * @param text - Source text for one line.
 * @param doc - Document used to create nodes.
 * @param gfm - Enable GFM-only inlines (strikethrough).
 */
export function appendInline(parent: DOMNodeLike, text: string, doc: DOMDocumentLike, gfm: boolean): void {
  let i = 0;
  let literal = "";
  const flushLiteral = (): void => {
    if (literal !== "") {
      parent.appendChild(doc.createTextNode(literal));
      literal = "";
    }
  };
  while (i < text.length) {
    const ch = text[i] as string;
    if (ch === "\\" && i + 1 < text.length && ESCAPABLE_RE.test(text[i + 1] as string)) {
      literal += text[i + 1];
      i += 2;
      continue;
    }
    if (ch === "`") {
      const run = /^`+/.exec(text.slice(i)) as RegExpExecArray;
      const close = text.indexOf(run[0], i + run[0].length);
      if (close !== -1) {
        flushLiteral();
        const code = doc.createElement("code");
        code.appendChild(doc.createTextNode(text.slice(i + run[0].length, close)));
        parent.appendChild(code);
        i = close + run[0].length;
        continue;
      }
      literal += ch;
      i++;
      continue;
    }
    if (ch === "!" && text[i + 1] === "[") {
      const link = tryParseLink(text, i + 1);
      if (link && link.href !== "") {
        flushLiteral();
        const img = doc.createElement("img");
        img.setAttribute?.("src", link.href);
        img.setAttribute?.("alt", link.label);
        parent.appendChild(img);
        i = link.end;
        continue;
      }
    }
    if (ch === "[") {
      const link = tryParseLink(text, i);
      if (link) {
        flushLiteral();
        const anchor = doc.createElement("a");
        anchor.setAttribute?.("href", link.href);
        appendInline(anchor, link.label, doc, gfm);
        parent.appendChild(anchor);
        i = link.end;
        continue;
      }
      literal += ch;
      i++;
      continue;
    }
    if (ch === "<") {
      // TODO: detect and parse raw HTML (inline tags here, block-level tags
      // in the block parser) instead of leaving non-autolinks literal.
      const end = text.indexOf(">", i + 1);
      if (end !== -1 && AUTOLINK_RE.test(text.slice(i + 1, end))) {
        flushLiteral();
        const href = text.slice(i + 1, end);
        const anchor = doc.createElement("a");
        anchor.setAttribute?.("href", href);
        anchor.appendChild(doc.createTextNode(href));
        parent.appendChild(anchor);
        i = end + 1;
        continue;
      }
      literal += ch;
      i++;
      continue;
    }
    const token = matchEmphasis(text, i, gfm);
    if (token) {
      const close = findEmphasisClose(text, i + token.marker.length, token);
      if (close !== -1 && close > i + token.marker.length) {
        flushLiteral();
        const el = doc.createElement(token.tag);
        appendInline(el, text.slice(i + token.marker.length, close), doc, gfm);
        parent.appendChild(el);
        i = close + token.marker.length;
        continue;
      }
      literal += token.marker;
      i += token.marker.length;
      continue;
    }
    literal += ch;
    i++;
  }
  flushLiteral();
}

/**
 * Split a paragraph line into text plus a trailing hard break marker.
 *
 * @param line - Raw paragraph line.
 * @returns Text without the break marker, and whether one was present.
 */
export function splitHardBreak(line: string): { text: string; hardBreak: boolean } {
  const hardBreak = / {2,}$/.test(line);
  return { text: hardBreak ? line.replace(/ {2,}$/, "") : line, hardBreak };
}
