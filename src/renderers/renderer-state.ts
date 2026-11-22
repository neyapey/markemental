import { hasOpenFence, isBlankLine, splitBlocks } from "../core/util/blocks";
import { Block } from "../core/types/block";

/**
 * Mutable parse state carried across `push` calls.
 *
 * @remarks
 * Holds buffered lines for the currently open block so a pipeline can render
 * complete blocks incrementally while holding back a trailing partial block.
 *
 * @public
 */
export class RendererState {
  private _pending: string[] = [];

  /**
   * Buffer newly arrived lines.
   *
   * @param lines - Complete source lines to buffer.
   */
  addLines(lines: string[]): void {
    for (const line of lines) this._pending.push(line);
  }

  /**
   * Parse buffered lines, returning every block except a trailing partial one.
   *
   * @remarks
   * The last block is held back because more input may still extend it.
   * Nothing is returned while the buffer ends inside an unclosed fence.
   *
   * @returns Complete blocks ready to render.
   */
  takeCompleteBlocks(): Block[] {
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
      return [];
    }
    if (hasOpenFence(trimmed)) return [];
    const blocks = splitBlocks(trimmed);
    const last = blocks[blocks.length - 1];
    if (last === undefined) {
      this._pending = [];
      return [];
    }
    this._pending = trimmed.slice(trimmed.length - last.sourceLineCount);
    return blocks.slice(0, -1);
  }

  /**
   * Parse and drain all buffered lines, including a trailing partial block.
   *
   * @returns Every remaining block.
   */
  takeAllBlocks(): Block[] {
    const blocks = splitBlocks(this._pending);
    this._pending = [];
    return blocks;
  }
}
