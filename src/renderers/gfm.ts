import { DOMDocumentLike, DOMNodeLike } from "../core/types/dom-like";
import { MarkdownRenderer } from "../core/types/renderer";
import { RenderTarget } from "../core/types/target";
import { CommonMarkRenderer, CommonMarkRenderOptions } from "./commonmark";
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
 * Tables commit at the delimiter row and stream one row at a time; column
 * widths come from the header row, short rows are padded, and extra cells
 * on wide rows are kept as unaligned cells.
 *
 * @public
 */
export class GFMRenderer extends CommonMarkRenderer implements MarkdownRenderer {
  /** Rendering options. */
  readonly options: GFMRenderOptions;
  private _table: { body: DOMNodeLike; aligns: Array<Alignment | null>; width: number } | null = null;

  /**
   * @param target - Destination for rendered output, from
   * `createRenderTarget`. Pass `requestAnimationFrame` there to batch
   * writes on animation frames, or nothing for synchronous writes.
   * @param doc - Document used to create nodes.
   * @param opts - GFM rendering options.
   */
  constructor(target: RenderTarget, doc: DOMDocumentLike, opts: GFMRenderOptions) {
    super(target, doc, opts);
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
   * Commit the table with its header; body rows stream in afterwards.
   *
   * @param headLine - Raw header row line.
   * @param delimLine - Delimiter row line carrying column alignment.
   */
  protected override _applyTableHead(headLine: string, delimLine: string): void {
    const header = splitRow(headLine);
    const aligns = splitRow(delimLine).map(parseAlignment);
    const width = header.length;
    const table = this._doc.createElement("table");
    const head = this._doc.createElement("thead");
    const headRow = this._doc.createElement("tr");
    for (let col = 0; col < width; col++) {
      const cell = this._doc.createElement("th");
      const align = aligns[col] ?? null;
      if (align !== null) cell.setAttribute?.("align", align);
      appendInline(cell, header[col] ?? "", this._doc, true);
      headRow.appendChild(cell);
    }
    head.appendChild(headRow);
    table.appendChild(head);
    const body = this._doc.createElement("tbody");
    table.appendChild(body);
    this._commit(table, null);
    this._table = { body, aligns, width };
  }

  /**
   * Append one body row to the open table.
   *
   * @param line - Raw body row line.
   */
  protected override _applyTableRow(line: string): void {
    const table = this._table;
    if (table === null) return;
    const cells = splitRow(line);
    const row = this._doc.createElement("tr");
    for (let col = 0; col < table.width; col++) {
      const cell = this._doc.createElement("td");
      const align = table.aligns[col] ?? null;
      if (align !== null) cell.setAttribute?.("align", align);
      appendInline(cell, cells[col] ?? "", this._doc, true);
      row.appendChild(cell);
    }
    for (let col = table.width; col < cells.length; col++) {
      const cell = this._doc.createElement("td");
      appendInline(cell, cells[col] as string, this._doc, true);
      row.appendChild(cell);
    }
    this._commit(row, table.body);
  }

  /**
   * Close the open table.
   */
  protected override _applyTableEnd(): void {
    this._table = null;
  }
}

/**
 * Options for {@link GFMRenderer}.
 *
 * @public
 */
export type GFMRenderOptions = CommonMarkRenderOptions;
