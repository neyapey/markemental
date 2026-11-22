/**
 * Buffers pushed text and emits complete lines.
 *
 * @public
 */
export interface LineSource {
  /**
   * Push text into the buffer.
   *
   * @param chunk - Raw markdown text, with or without line breaks.
   */
  push(chunk: string): void;
  /**
   * Drain newline-terminated lines, holding back any trailing partial line.
   *
   * @returns Complete lines without line breaks.
   */
  readLines(): string[];
  /**
   * Close the source and drain the trailing partial line, if any.
   *
   * @returns Zero or one remaining line.
   */
  close(): string[];
}
