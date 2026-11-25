import { Block } from "../core/types/block";
import {
  fenceCloses,
  hasOpenFence,
  isBlankLine,
  isRuleLine,
  isTableDelimiter,
  matchFence,
  matchHeading,
  matchListItem,
  matchQuote,
  splitBlocks,
  type ListItemMatch,
} from "./parser/blocks";

/**
 * Structural piece of a document emitted as lines are parsed.
 *
 * @remarks
 * Whole leaf blocks (headings, paragraphs, fences, quotes, rules) arrive as
 * single `block` fragments once complete. Lists stream: an opening fragment
 * commits the container, one fragment per item follows, and a closing
 * fragment ends it. Tables stream the same way (head, rows, end), but only
 * {@link GFMState} emits those; {@link CommonMarkState} never does.
 *
 * @internal
 */
export type ParseFragment =
  | { kind: "block"; block: Block }
  | { kind: "listStart"; ordered: boolean }
  | { kind: "listItem"; text: string }
  | { kind: "listEnd" }
  | { kind: "tableHead"; headLine: string; delimLine: string }
  | { kind: "tableRow"; line: string }
  | { kind: "tableEnd" };

interface OpenFence {
  marker: string;
  length: number;
  openLine: string;
  content: string[];
}

interface ListFrame {
  ordered: boolean;
  indent: number;
}

/**
 * Incremental line-driven parser for CommonMark structure.
 *
 * @remarks
 * Internal helper owned by a renderer. Lines arrive one at a time: leaf
 * blocks buffer until a new block starts or the stream flushes (preserving
 * trailing holdback), and lists commit one fragment per item with an indent
 * stack for nesting. Tables are not recognized here, so table-looking lines
 * stay plain paragraph text; {@link GFMState} extends this class with table
 * support and nothing else.
 *
 * @internal
 */
export class CommonMarkState {
  protected _pending: string[] = [];
  private _fence: OpenFence | null = null;
  private _quote: string[] | null = null;
  private _lists: ListFrame[] = [];

  /**
   * @param emit - Receives parse fragments in document order.
   */
  constructor(protected _emit: (fragment: ParseFragment) => void) {}

  /**
   * Feed one source line; completed fragments emit to the handler.
   *
   * @param line - Next source line, without its line break.
   */
  addLine(line: string): void {
    if (this._consumeFence(line)) return;
    if (this._consumeLists(line)) return;
    if (this._consumeQuote(line)) return;
    this._classify(line);
  }

  /**
   * Close every open context and emit the trailing remainder.
   */
  flush(): void {
    this._closeLists();
    if (this._quote !== null) {
      this._pending.push(...this._quote);
      this._quote = null;
    }
    if (this._fence !== null) {
      this._pending.push(this._fence.openLine, ...this._fence.content);
      this._fence = null;
    }
    this._takeAll();
  }

  /**
   * Feed a line to the open fence, if any.
   *
   * @param line - Next source line.
   * @returns True when the line was consumed.
   */
  protected _consumeFence(line: string): boolean {
    if (this._fence === null) return false;
    if (fenceCloses(this._fence, line)) {
      this._pending.push(this._fence.openLine, ...this._fence.content, line);
      this._fence = null;
      this._takeComplete();
    } else {
      this._fence.content.push(line);
    }
    return true;
  }

  /**
   * Feed a line to the open lists, if any, closing and reprocessing when
   * the line is not an item.
   *
   * @param line - Next source line.
   * @returns True when the line was consumed or reprocessed.
   */
  protected _consumeLists(line: string): boolean {
    if (this._lists.length === 0) return false;
    const item = matchListItem(line);
    if (item !== null) {
      this._listItem(item);
      return true;
    }
    this._closeLists();
    this.addLine(line);
    return true;
  }

  /**
   * Feed a line to the open quote, if any, dumping it back to pending when
   * the line does not continue the quote.
   *
   * @param line - Next source line.
   * @returns True when the line was consumed.
   */
  protected _consumeQuote(line: string): boolean {
    if (this._quote === null) return false;
    if (matchQuote(line) !== null) {
      this._quote.push(line);
      return true;
    }
    this._pending.push(...this._quote);
    this._quote = null;
    return false;
  }

  /**
   * Classify a line that continues no open context.
   *
   * @param line - Next source line.
   */
  protected _classify(line: string): void {
    if (isBlankLine(line)) {
      this._pending.push(line);
      return;
    }
    const fence = matchFence(line);
    if (fence !== null) {
      this._takeAll();
      this._fence = { marker: fence.marker, length: fence.length, openLine: line, content: [] };
      return;
    }
    if (matchHeading(line) !== null || isRuleLine(line)) {
      this._takeAll();
      this._pending.push(line);
      return;
    }
    if (matchQuote(line) !== null) {
      this._takeAll();
      this._quote = [line];
      return;
    }
    const item = matchListItem(line);
    if (item !== null) {
      this._takeAll();
      this._listItem(item);
      return;
    }
    if (this._classifyPipe(line)) return;
    this._pending.push(line);
    this._takeComplete();
  }

  /**
   * Classify a line that matches no CommonMark opener. The base parser has
   * no pipe syntax, so this never consumes; {@link GFMState} overrides it
   * to start table candidates.
   *
   * @param _line - Next source line.
   * @returns Always false here.
   */
  protected _classifyPipe(_line: string): boolean {
    return false;
  }

  private _listItem(item: ListItemMatch): void {
    while (this._lists.length > 0 && item.indent < (this._lists[this._lists.length - 1] as ListFrame).indent) {
      this._lists.pop();
      this._emit({ kind: "listEnd" });
    }
    const top = this._lists[this._lists.length - 1];
    if (top && top.indent === item.indent && top.ordered === item.ordered) {
      this._emit({ kind: "listItem", text: item.text });
      return;
    }
    if (top && top.indent === item.indent) {
      this._lists.pop();
      this._emit({ kind: "listEnd" });
    }
    this._emit({ kind: "listStart", ordered: item.ordered });
    this._lists.push({ ordered: item.ordered, indent: item.indent });
    this._emit({ kind: "listItem", text: item.text });
  }

  private _closeLists(): void {
    while (this._lists.length > 0) {
      this._lists.pop();
      this._emit({ kind: "listEnd" });
    }
  }

  private _takeComplete(): void {
    // Drop separator blanks first: they carry no content, and trimming
    // guarantees the last block ends at the buffer end so the holdback slice
    // below keeps exactly that block's lines.
    let start = 0;
    let end = this._pending.length;
    while (start < end && isBlankLine(this._pending[start] as string)) start++;
    while (end > start && isBlankLine(this._pending[end - 1] as string)) end--;
    const trimmed = this._pending.slice(start, end);
    if (trimmed.length === 0) {
      this._pending = [];
      return;
    }
    if (hasOpenFence(trimmed)) return;
    const blocks = splitBlocks(trimmed);
    const last = blocks[blocks.length - 1];
    if (last === undefined) {
      this._pending = [];
      return;
    }
    this._pending = trimmed.slice(trimmed.length - last.sourceLineCount);
    for (const block of blocks.slice(0, -1)) this._emit({ kind: "block", block });
  }

  protected _takeAll(): void {
    const blocks = splitBlocks(this._pending);
    this._pending = [];
    for (const block of blocks) this._emit({ kind: "block", block });
  }
}

/**
 * Incremental line-driven parser for GFM structure.
 *
 * @remarks
 * Extends {@link CommonMarkState} with tables and nothing else: a table
 * commits at the delimiter row and streams one fragment per row. All leaf
 * and list parsing is inherited unchanged.
 *
 * @internal
 */
export class GFMState extends CommonMarkState {
  private _tableOpen = false;
  private _candidate: string | null = null;

  /**
   * Feed one source line; completed fragments emit to the handler.
   *
   * @param line - Next source line, without its line break.
   */
  override addLine(line: string): void {
    if (this._consumeFence(line)) return;
    if (this._consumeTable(line)) return;
    if (this._consumeLists(line)) return;
    if (this._consumeQuote(line)) return;
    if (this._consumeCandidate(line)) return;
    this._classify(line);
  }

  /**
   * Close every open context and emit the trailing remainder.
   */
  override flush(): void {
    if (this._candidate !== null) {
      this._pending.push(this._candidate);
      this._candidate = null;
    }
    if (this._tableOpen) {
      this._emit({ kind: "tableEnd" });
      this._tableOpen = false;
    }
    super.flush();
  }

  /**
   * Feed a line to the open table, if any, closing and reprocessing when
   * the line is not a row.
   *
   * @param line - Next source line.
   * @returns True when the line was consumed or reprocessed.
   */
  private _consumeTable(line: string): boolean {
    if (!this._tableOpen) return false;
    if (!isBlankLine(line) && line.includes("|")) {
      this._emit({ kind: "tableRow", line });
      return true;
    }
    this._emit({ kind: "tableEnd" });
    this._tableOpen = false;
    this.addLine(line);
    return true;
  }

  /**
   * Resolve a pending table header candidate against the next line.
   *
   * @param line - Next source line.
   * @returns True when a table opened.
   */
  private _consumeCandidate(line: string): boolean {
    if (this._candidate === null) return false;
    if (isTableDelimiter(line)) {
      this._emit({ kind: "tableHead", headLine: this._candidate, delimLine: line });
      this._candidate = null;
      this._tableOpen = true;
      return true;
    }
    this._pending.push(this._candidate);
    this._candidate = null;
    return false;
  }

  /**
   * Start a table header candidate on pipe lines.
   *
   * @param line - Next source line.
   * @returns True when the line starts a candidate.
   */
  protected override _classifyPipe(line: string): boolean {
    if (!line.includes("|")) return false;
    this._takeAll();
    this._candidate = line;
    return true;
  }
}
