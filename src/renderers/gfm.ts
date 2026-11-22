import { Block } from "../core/types/block";
import { DOMDocumentLike, DOMNodeLike } from "../core/types/dom-like";
import { MarkdownRenderer } from "../core/types/renderer";
import { RenderTarget } from "../core/types/target";
import { CommonMarkRenderer } from "./commonmark";
import { appendInline } from "./util/inline";

type Alignment = "left" | "center" | "right" | null;

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function parseAlignment(cell: string): Alignment {
  const left = cell.startsWith(":");
  const right = cell.endsWith(":");
  if (left && right) return "center";
  if (right) return "right";
  if (left) return "left";
  return null;
}

/**
 * Renderer for GitHub Flavored Markdown.
 *
 * @remarks
 * Supports CommonMark blocks and inlines plus GFM tables and strikethrough.
 *
 * @public
 */
export class GFMRenderer extends CommonMarkRenderer implements MarkdownRenderer {
  /** Rendering options. */
  readonly options: GFMRenderOptions;

  /**
   * @param target - Destination for rendered output. Use an
   * `AnimatedDOMTarget` with `requestAnimationFrame` to batch writes on
   * animation frames, or a `DOMTarget` for synchronous writes.
   * @param doc - Document used to create nodes.
   * @param opts - GFM rendering options.
   */
  constructor(target: RenderTarget, doc: DOMDocumentLike, opts: GFMRenderOptions) {
    super(target, doc, {});
    this.options = opts;
  }

  /**
   * GFM-only inlines are enabled.
   *
   * @returns True.
   */
  protected override inlineGfm(): boolean {
    return true;
  }

  /**
   * Render one block to a DOM-like node, handling GFM tables.
   *
   * @param block - Parsed block to render.
   * @param doc - Document used to create nodes.
   * @returns The rendered node, or `null` to emit nothing.
   */
  protected override renderBlock(block: Block, doc: DOMDocumentLike): DOMNodeLike | null {
    if (block.kind !== "table") return super.renderBlock(block, doc);
    const rows = block.lines.map(splitRow);
    const header = rows[0] ?? [];
    const alignments = (rows[1] ?? []).map(parseAlignment);
    const width = Math.max(header.length, ...rows.map((row) => row.length));
    const table = doc.createElement("table");
    const head = doc.createElement("thead");
    const headRow = doc.createElement("tr");
    for (let col = 0; col < width; col++) {
      const cell = doc.createElement("th");
      const align = alignments[col] ?? null;
      if (align !== null) cell.setAttribute?.("align", align);
      appendInline(cell, header[col] ?? "", doc, true);
      headRow.appendChild(cell);
    }
    head.appendChild(headRow);
    table.appendChild(head);
    const body = doc.createElement("tbody");
    for (const row of rows.slice(2)) {
      const bodyRow = doc.createElement("tr");
      for (let col = 0; col < width; col++) {
        const cell = doc.createElement("td");
        const align = alignments[col] ?? null;
        if (align !== null) cell.setAttribute?.("align", align);
        appendInline(cell, row[col] ?? "", doc, true);
        bodyRow.appendChild(cell);
      }
      body.appendChild(bodyRow);
    }
    table.appendChild(body);
    return table;
  }
}

/**
 * Options for {@link GFMRenderer}.
 *
 * @public
 */
export type GFMRenderOptions = {

}
