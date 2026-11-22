import { LineSource } from "../core/types/source";

/**
 * Create a line source that splits pushed text into lines.
 *
 * @returns A new line source.
 *
 * @public
 */
export function createLineSource(): LineSource {
  let buffer = "";
  let closed = false;
  return {
    push(chunk: string): void {
      if (closed) throw new Error("push after close");
      buffer += chunk;
    },
    readLines(): string[] {
      const lines: string[] = [];
      let at = buffer.indexOf("\n");
      while (at !== -1) {
        lines.push(buffer.slice(0, at).replace(/\r$/, ""));
        buffer = buffer.slice(at + 1);
        at = buffer.indexOf("\n");
      }
      return lines;
    },
    close(): string[] {
      closed = true;
      if (buffer === "") return [];
      const rest = buffer.replace(/\r$/, "");
      buffer = "";
      return [rest];
    },
  };
}
