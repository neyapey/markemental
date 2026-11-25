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
 * Structural piece of the document emitted as lines are parsed.
 *
 * @remarks
 * Whole leaf blocks (headings, paragraphs, fences, quotes, rules) arrive as
 * single `block` fragments once complete. Tables and lists stream: an
 * opening fragment commits the container, one fragment per row or item
 * follows, and a closing fragment ends it.
 *
 * @internal
 */
export type ParseFragment =
  | { kind: "block"; block: Block }
  | { kind: "tableHead"; headLine: string; delimLine: string }
  | { kind: "tableRow"; line: string }
  | { kind: "tableEnd" }
  | { kind: "listStart"; ordered: boolean }
  | { kind: "listItem"; text: string }
  | { kind: "listEnd" };

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
 * Incremental line-driven parser tracking what is currently being parsed.
 *
 * @remarks
 * Internal helper owned by a renderer. Lines arrive one at a time: leaf
 * blocks buffer until a new block starts or the stream flushes (preserving
 * trailing holdback), while tables commit at the delimiter row and stream
 * one fragment per row, and lists commit one fragment per item with an
 * indent stack for nesting. The renderer turns fragments into nodes and
 * tracks where each commits.
 *
 * @internal
 */
export class RendererState {
  private _pending: string[] = [];
  private _emit: (fragment: ParseFragment) => void;
  private _fence: OpenFence | null = null;
  private _quote: string[] | null = null;
  private _tableOpen = false;
  private _candidate: string | null = null;
  private _lists: ListFrame[] = [];

  /**
   * @param emit - Receives parse fragments in document order.
   */
  constructor(emit: (fragment: ParseFragment) => void) {
    this._emit = emit;
  }

  /**
   * Feed one source line; completed fragments emit to the handler.
   *
   * @param line - Next source line, without its line break.
   */
  addLine(line: string): void {
    if (this._fence !== null) {
      if (fenceCloses(this._fence, line)) {
        this._pending.push(this._fence.openLine, ...this._fence.content, line);
        this._fence = null;
        this._takeComplete();
      } else {
        this._fence.content.push(line);
      }
      return;
    }
    if (this._tableOpen) {
      if (!isBlankLine(line) && line.includes("|")) {
        this._emit({ kind: "tableRow", line });
        return;
      }
      this._emit({ kind: "tableEnd" });
      this._tableOpen = false;
    }
    if (this._lists.length > 0) {
      const item = matchListItem(line);
      if (item !== null) {
        this._listItem(item);
        return;
      }
      this._closeLists();
    }
    if (this._quote !== null) {
      if (matchQuote(line) !== null) {
        this._quote.push(line);
        return;
      }
      this._pending.push(...this._quote);
      this._quote = null;
    }
    if (this._candidate !== null) {
      if (isTableDelimiter(line)) {
        this._emit({ kind: "tableHead", headLine: this._candidate, delimLine: line });
        this._candidate = null;
        this._tableOpen = true;
        return;
      }
      this._pending.push(this._candidate);
      this._candidate = null;
    }
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
    if (line.includes("|")) {
      this._takeAll();
      this._candidate = line;
      return;
    }
    this._pending.push(line);
    this._takeComplete();
  }

  /**
   * Close every open context and emit the trailing remainder.
   */
  flush(): void {
    if (this._candidate !== null) {
      this._pending.push(this._candidate);
      this._candidate = null;
    }
    if (this._tableOpen) {
      this._emit({ kind: "tableEnd" });
      this._tableOpen = false;
    }
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

  private _takeAll(): void {
    const blocks = splitBlocks(this._pending);
    this._pending = [];
    for (const block of blocks) this._emit({ kind: "block", block });
  }
}
