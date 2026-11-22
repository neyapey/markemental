import { MarkdownPipeline } from "../types/pipeline";
import { MarkdownRenderer } from "../types/renderer";
import { createLineSource } from "../../sources/line-source";

/**
 * Create a pipeline around any renderer.
 *
 * @remarks
 * The pipeline feeds the renderer one line at a time from whatever chunks
 * are pushed; the renderer owns its target, document, and parse state. Pass
 * a built-in renderer (`GFMRenderer`, `CommonMarkRenderer`) or your own
 * `MarkdownRenderer` implementation.
 *
 * @param renderer - Line-consuming renderer holding its own target and state.
 * @returns A working pipeline.
 *
 * @example
 * ```ts
 * const pipeline = createMarkdownPipeline(
 *   new GFMRenderer(createRenderTarget(target), document, {}),
 * );
 * await pipeline.push("# Hello\n");
 * await pipeline.flush();
 * ```
 *
 * @public
 */
export function createMarkdownPipeline(renderer: MarkdownRenderer): MarkdownPipeline {
  const source = createLineSource();

  function feed(lines: string[]): void {
    for (const line of lines) renderer.writeLine(line);
  }

  return {
    async push(chunk: string | Promise<string>): Promise<void> {
      source.push(await chunk);
      feed(source.readLines());
    },
    async flush(): Promise<void> {
      feed(source.close());
      await renderer.flush();
    },
  };
}
