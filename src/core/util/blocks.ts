import { Block } from "../types/block";

const HEADING_RE = /^(#{1,6})(?:\s+(.*))?\s*$/;
const RULE_RE = /^(?:\*\s*){3,}$|^(?:-\s*){3,}$|^(?:_\s*){3,}$/;
const FENCE_RE = /^(`{3,}|~{3,})\s*([^`]*)$/;
const QUOTE_RE = /^>\s?(.*)$/;
const BULLET_RE = /^\s*[-*+]\s+(.*)$/;
const ORDERED_RE = /^\s*\d+[.)]\s+(.*)$/;
const TABLE_DELIM_CELL_RE = /^:?-{1,}:?$/;

/**
 * Whether a line is blank (a pure block separator carrying no content).
 *
 * @param line - Source line to test.
 * @returns True for empty or whitespace-only lines.
 */
export function isBlankLine(line: string): boolean {
  return line.trim() === "";
}

function isBlank(line: string): boolean {
  return isBlankLine(line);
}

function isTableDelimiter(line: string): boolean {
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
  let openChar = "";
  let openLen = 0;
  for (const line of lines) {
    const match = FENCE_RE.exec(line.trim());
    if (!match || !match[1]) continue;
    const run = match[1];
    if (openChar === "") {
      openChar = run[0] as string;
      openLen = run.length;
    } else if (run[0] === openChar && run.length >= openLen) {
      openChar = "";
      openLen = 0;
    }
  }
  return openChar !== "";
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
    if (isBlank(line)) {
      i++;
      continue;
    }
    const fence = FENCE_RE.exec(line.trim());
    if (fence && fence[1]) {
      const run = fence[1];
      const language = (fence[2] ?? "").trim() || undefined;
      const content: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const inner = lines[j] as string;
        const close = FENCE_RE.exec(inner.trim());
        if (close && close[1] && close[1][0] === run[0] && close[1].length >= run.length) break;
        content.push(inner);
        j++;
      }
      const closed = j < lines.length;
      blocks.push(makeBlock({ kind: "fence", lines: content, language }, j - i + (closed ? 1 : 0)));
      i = j + (closed ? 1 : 0);
      continue;
    }
    const heading = HEADING_RE.exec(line);
    if (heading && heading[1]) {
      const text = (heading[2] ?? "").replace(/\s+#+\s*$/, "").trim();
      blocks.push(makeBlock({ kind: "heading", lines: [text], level: Math.min(6, heading[1].length) }, 1));
      i++;
      continue;
    }
    if (RULE_RE.test(line.trim())) {
      blocks.push(makeBlock({ kind: "rule", lines: [] }, 1));
      i++;
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && isTableDelimiter(lines[i + 1] as string)) {
      const rows = [line, lines[i + 1] as string];
      let j = i + 2;
      while (j < lines.length && !(isBlank(lines[j] as string)) && (lines[j] as string).includes("|")) {
        rows.push(lines[j] as string);
        j++;
      }
      blocks.push(makeBlock({ kind: "table", lines: rows }, j - i));
      i = j;
      continue;
    }
    const quote = QUOTE_RE.exec(line);
    if (quote) {
      const quoted = [quote[1] ?? ""];
      let j = i + 1;
      while (j < lines.length) {
        const next = QUOTE_RE.exec(lines[j] as string);
        if (!next) break;
        quoted.push(next[1] ?? "");
        j++;
      }
      blocks.push(makeBlock({ kind: "quote", lines: quoted }, j - i));
      i = j;
      continue;
    }
    const bullet = BULLET_RE.exec(line);
    const ordered = ORDERED_RE.exec(line);
    if (bullet || ordered) {
      const isOrdered = !bullet;
      const items = [(bullet?.[1] ?? ordered?.[1] ?? "")];
      let j = i + 1;
      while (j < lines.length) {
        const nextBullet = BULLET_RE.exec(lines[j] as string);
        const nextOrdered = ORDERED_RE.exec(lines[j] as string);
        if (isOrdered && nextOrdered) items.push(nextOrdered[1] ?? "");
        else if (!isOrdered && nextBullet && !ORDERED_RE.test(lines[j] as string)) items.push(nextBullet[1] ?? "");
        else break;
        j++;
      }
      blocks.push(makeBlock({ kind: "list", lines: items, ordered: isOrdered }, j - i));
      i = j;
      continue;
    }
    const paragraph = [line];
    let j = i + 1;
    while (j < lines.length) {
      const next = lines[j] as string;
      if (
        isBlank(next) ||
        FENCE_RE.test(next.trim()) ||
        HEADING_RE.test(next) ||
        RULE_RE.test(next.trim()) ||
        QUOTE_RE.test(next) ||
        BULLET_RE.test(next) ||
        ORDERED_RE.test(next) ||
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
