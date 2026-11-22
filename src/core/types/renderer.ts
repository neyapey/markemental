/**
 * Incremental markdown renderer: consumes lines, updates a target.
 *
 * @remarks
 * A renderer is constructed with everything it needs: the target it writes
 * to, the document used to create nodes, and its flavor options. The
 * pipeline feeds it one complete line at a time; the renderer holds whatever
 * parse state it needs and writes finished output to its target as input
 * completes.
 *
 * Implement this interface to plug in your own renderer, hand-written or a
 * third-party adapter.
 *
 * @public
 */
export interface MarkdownRenderer {
  /**
   * Feed one complete line to the renderer.
   *
   * @param line - Next source line, without its line break. The renderer
   * buffers what it needs and writes completed output to its target.
   */
  writeLine(line: string): void;
  /**
   * Flush buffered partial state to the target and settle it.
   *
   * @returns A promise that resolves once all output has landed in the target.
   */
  flush(): Promise<void>;
}
