import { Block } from "../types/block";

const HEADING_RE = /^(#{1,6})(?:\s+(.*))?\s*$/;
const RULE_RE = /^(?:\*\s*){3,}$|^(?:-\s*){3,}$|^(?:_\s*){3,}$/;
const FENCE_RE = /^(`{3,}|~{3,})\s*([^`]*)$/;
const QUOTE_RE = /^>\s?(.*)$/;
const BULLET_RE = /^\s*[-*+]\s+(.*)$/;
const ORDERED_RE = /^\s*\d+[.)]\s+(.*)$/;
const TABLE_DELIM_CELL_RE = /^:?-{1,}:?$/;
const LEADING_WS_RE = /^\s*/;

/**
 * Whether a line is blank (a pure block separator carrying no content).
 *
 * @param line - Source line to test.
 * @returns True for empty or whitespace-only lines.
 */
export function isBlankLine(line: string): boolean {
  return line.trim() === "";
}

/**
 * An opening or closing fence marker found on one line.
 */
export interface FenceMatch {
  /** Fence character: backtick or tilde. */
  marker: string;
  /** Length of the marker run (three or more). */
  length: number;
  /** Info string after the marker, when present. */
  language: string | undefined;
}

/**
 * Match a fence marker line.
 *
 * @param line - Source line to test.
 * @returns The marker, or null when the line is not a fence marker.
 */
export function matchFence(line: string): FenceMatch | null {
  const match = FENCE_RE.exec(line.trim());
  if (!match || !match[1]) return null;
  const run = match[1];
  return {
    marker: run[0] as string,
    length: run.length,
    language: (match[2] ?? "").trim() || undefined,
  };
}

/**
 * Whether a line closes an open fence.
 *
 * @param open - Marker that opened the fence.
 * @param line - Source line to test.
 * @returns True for a same-character run at least as long.
 */
export function fenceCloses(open: { marker: string; length: number }, line: string): boolean {
  const match = matchFence(line);
  return match !== null && match.marker === open.marker && match.length >= open.length;
}

/**
 * An ATX heading found on one line.
 */
export interface HeadingMatch {
  /** Heading level (1-6). */
  level: number;
  /** Heading text with closing hashes stripped. */
  text: string;
}

/**
 * Match an ATX heading line.
 *
 * @param line - Source line to test.
 * @returns The heading, or null for non-heading lines.
 */
export function matchHeading(line: string): HeadingMatch | null {
  const match = HEADING_RE.exec(line);
  if (!match || !match[1]) return null;
  return {
    level: Math.min(6, match[1].length),
    text: (match[2] ?? "").replace(/\s+#+\s*$/, "").trim(),
  };
}

/**
 * Whether a line is a thematic break.
 *
 * @param line - Source line to test.
 * @returns True for `***`, `---`, `___` style lines.
 */
export function isRuleLine(line: string): boolean {
  return RULE_RE.test(line.trim());
}

/**
 * A quote line with its marker stripped.
 */
export interface QuoteMatch {
  /** Line content after the `>` marker. */
  text: string;
}

/**
 * Match a quote line.
 *
 * @param line - Source line to test.
 * @returns The content, or null for non-quote lines.
 */
export function matchQuote(line: string): QuoteMatch | null {
  const match = QUOTE_RE.exec(line);
  if (!match) return null;
  return { text: match[1] ?? "" };
}

/**
 * A list item marker found on one line.
 */
export interface ListItemMatch {
  /** Whether the marker is ordered (`1.` / `1)`). */
  ordered: boolean;
  /** Number of leading whitespace characters. */
  indent: number;
  /** Item text after the marker. */
  text: string;
}

/**
 * Match a bullet or ordered list item line.
 *
 * @param line - Source line to test.
 * @returns The item, or null for non-item lines.
 */
export function matchListItem(line: string): ListItemMatch | null {
  const bullet = BULLET_RE.exec(line);
  const ordered = ORDERED_RE.exec(line);
  if (!bullet && !ordered) return null;
  return {
    ordered: !bullet,
    indent: LEADING_WS_RE.exec(line)?.[0].length ?? 0,
    text: bullet?.[1] ?? ordered?.[1] ?? "",
  };
}

/**
 * Whether a line continues a bullet list (a bullet marker that is not also
 * ordered-looking).
 *
 * @param line - Source line to test.
 * @returns True for bullet continuations.
 */
export function isBulletItem(line: string): boolean {
  return BULLET_RE.test(line) && !ORDERED_RE.test(line);
}

/**
 * Whether a line continues an ordered list.
 *
 * @param line - Source line to test.
 * @returns True for ordered markers.
 */
export function isOrderedItem(line: string): boolean {
  return ORDERED_RE.test(line);
}

/**
 * Whether a line is a table delimiter row.
 *
 * @param line - Source line to test.
 * @returns True for `|---|...` style rows.
 */
export function isTableDelimiter(line: string): boolean {
  if (!line.includes("|") && !line.includes("-")) return false;
  const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|");
  return cells.length > 0 && cells.every((cell) => TABLE_DELIM_CELL_RE.test(cell.trim()));
}

/**
 * Whether `lines` ends inside an unclosed fenced code block.
 *
 * @param lines - Source lines to scan.
 * @returns True when a fence opens without a matching close.
 */
export function hasOpenFence(lines: string[]): boolean {
  let open: { marker: string; length: number } | null = null;
  for (const line of lines) {
    if (open === null) {
      open = matchFence(line);
    } else if (fenceCloses(open, line)) {
      open = null;
    }
  }
  return open !== null;
}

function makeBlock(block: Omit<Block, "sourceLineCount">, sourceLineCount: number): Block {
  return { ...block, sourceLineCount };
}

/**
 * Split source lines into blocks.
 *
 * @param lines - Source lines without line breaks.
 * @returns Parsed blocks in document order.
 */
export function splitBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] as string;
    if (isBlankLine(line)) {
      i++;
      continue;
    }
    const fence = matchFence(line);
    if (fence) {
      const content: string[] = [];
      let j = i + 1;
      while (j < lines.length && !fenceCloses(fence, lines[j] as string)) {
        content.push(lines[j] as string);
        j++;
      }
      const closed = j < lines.length;
      blocks.push(makeBlock({ kind: "fence", lines: content, language: fence.language }, j - i + (closed ? 1 : 0)));
      i = j + (closed ? 1 : 0);
      continue;
    }
    const heading = matchHeading(line);
    if (heading) {
      blocks.push(makeBlock({ kind: "heading", lines: [heading.text], level: heading.level }, 1));
      i++;
      continue;
    }
    if (isRuleLine(line)) {
      blocks.push(makeBlock({ kind: "rule", lines: [] }, 1));
      i++;
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && isTableDelimiter(lines[i + 1] as string)) {
      const rows = [line, lines[i + 1] as string];
      let j = i + 2;
      while (j < lines.length && !isBlankLine(lines[j] as string) && (lines[j] as string).includes("|")) {
        rows.push(lines[j] as string);
        j++;
      }
      blocks.push(makeBlock({ kind: "table", lines: rows }, j - i));
      i = j;
      continue;
    }
    const quote = matchQuote(line);
    if (quote) {
      const quoted = [quote.text];
      let j = i + 1;
      while (j < lines.length) {
        const next = matchQuote(lines[j] as string);
        if (!next) break;
        quoted.push(next.text);
        j++;
      }
      blocks.push(makeBlock({ kind: "quote", lines: quoted }, j - i));
      i = j;
      continue;
    }
    const item = matchListItem(line);
    if (item) {
      const items = [item.text];
      let j = i + 1;
      while (j < lines.length) {
        const next = matchListItem(lines[j] as string);
        if (item.ordered && next?.ordered) items.push(next.text);
        else if (!item.ordered && next && !next.ordered) items.push(next.text);
        else break;
        j++;
      }
      blocks.push(makeBlock({ kind: "list", lines: items, ordered: item.ordered }, j - i));
      i = j;
      continue;
    }
    const paragraph = [line];
    let j = i + 1;
    while (j < lines.length) {
      const next = lines[j] as string;
      if (
        isBlankLine(next) ||
        matchFence(next) !== null ||
        matchHeading(next) !== null ||
        isRuleLine(next) ||
        matchQuote(next) !== null ||
        matchListItem(next) !== null ||
        (next.includes("|") && j + 1 < lines.length && isTableDelimiter(lines[j + 1] as string))
      ) {
        break;
      }
      paragraph.push(next);
      j++;
    }
    blocks.push(makeBlock({ kind: "paragraph", lines: paragraph }, j - i));
    i = j;
  }
  return blocks;
}
