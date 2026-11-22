/**
 * Block-level markdown constructs recognized by the MVP parser.
 *
 * @public
 */
export type BlockKind =
  | "heading"
  | "paragraph"
  | "fence"
  | "list"
  | "quote"
  | "rule"
  | "table";

/**
 * A parsed block of markdown lines.
 *
 * @public
 */
export interface Block {
  /** What kind of block this is. */
  kind: BlockKind;
  /**
   * Block content lines. Markers are stripped: `#` prefixes for headings,
   * list markers for lists, `>` prefixes for quotes, and fence lines for
   * fenced code. Paragraph lines are raw.
   */
  lines: string[];
  /** Heading level (1-6) for `"heading"` blocks. */
  level?: number;
  /** Fence info string for `"fence"` blocks, when present. */
  language?: string;
  /** Whether a `"list"` block is ordered. */
  ordered?: boolean;
  /**
   * Number of source lines this block was parsed from, used to hold back a
   * trailing partial block across `push` calls.
   */
  sourceLineCount: number;
}
