import { Block } from "../core/types/block";
import { DOMDocumentLike, DOMNodeLike } from "../core/types/dom-like";
import { MarkdownRenderer } from "../core/types/renderer";
import { appendInline } from "./util/inline";

/**
 * Renderer for CommonMark.
 *
 * @public
 */
export class CommonMarkRenderer implements MarkdownRenderer<CommonMarkRenderOptions> {
  /** Rendering options. */
  readonly options: CommonMarkRenderOptions;

  /**
   * @param opts - CommonMark rendering options.
   */
  constructor(opts: CommonMarkRenderOptions) {
    this.options = opts;
  }

  /**
   * Whether GFM-only inlines are enabled. Always false here; overridden by
   * {@link GFMRenderer}.
   *
   * @returns False.
   */
  protected inlineGfm(): boolean {
    return false;
  }

  /**
   * Render one block to a DOM-like node.
   *
   * @param block - Parsed block to render.
   * @param doc - Document used to create nodes.
   * @returns The rendered node, or `null` to emit nothing.
   */
  renderBlock(block: Block, doc: DOMDocumentLike): DOMNodeLike | null {
    switch (block.kind) {
      case "heading": {
        const heading = doc.createElement(`h${block.level ?? 1}`);
        this.appendLinesInline(heading, block.lines, doc, " ");
        return heading;
      }
      case "paragraph":
        return this.renderParagraph(block.lines, doc);
      case "fence": {
        const pre = doc.createElement("pre");
        const code = doc.createElement("code");
        if (block.language !== undefined) code.setAttribute?.("class", `language-${block.language}`);
        const text = block.lines.join("\n");
        code.appendChild(doc.createTextNode(text === "" ? "" : `${text}\n`));
        pre.appendChild(code);
        return pre;
      }
      case "list": {
        const list = doc.createElement(block.ordered ? "ol" : "ul");
        for (const item of block.lines) {
          const li = doc.createElement("li");
          appendInline(li, item, doc, this.inlineGfm());
          list.appendChild(li);
        }
        return list;
      }
      case "quote": {
        const quote = doc.createElement("blockquote");
        const body = doc.createElement("p");
        this.appendLinesInline(body, block.lines, doc, " ");
        quote.appendChild(body);
        return quote;
      }
      case "rule":
        return doc.createElement("hr");
      case "table":
        // CommonMark has no tables: degrade to a paragraph, skipping the
        // delimiter row.
        return this.renderParagraph(block.lines.filter((_, at) => at !== 1), doc);
    }
  }

  /**
   * Render paragraph lines, honoring two-space hard breaks.
   *
   * @param lines - Raw paragraph lines.
   * @param doc - Document used to create nodes.
   * @returns The paragraph element.
   */
  protected renderParagraph(lines: string[], doc: DOMDocumentLike): DOMNodeLike {
    const paragraph = doc.createElement("p");
    lines.forEach((line, at) => {
      const hardBreak = / {2,}$/.test(line);
      appendInline(paragraph, hardBreak ? line.replace(/ {2,}$/, "") : line, doc, this.inlineGfm());
      if (at < lines.length - 1) {
        if (hardBreak) paragraph.appendChild(doc.createElement("br"));
        else paragraph.appendChild(doc.createTextNode(" "));
      }
    });
    return paragraph;
  }

  private appendLinesInline(parent: DOMNodeLike, lines: string[], doc: DOMDocumentLike, join: string): void {
    lines.forEach((line, at) => {
      if (at > 0) parent.appendChild(doc.createTextNode(join));
      appendInline(parent, line, doc, this.inlineGfm());
    });
  }
}

/**
 * Options for {@link CommonMarkRenderer}.
 *
 * @public
 */
export type CommonMarkRenderOptions = {

}
