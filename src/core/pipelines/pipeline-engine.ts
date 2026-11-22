import { MarkdownPipeline } from "../types/pipeline";
import { MarkdownRenderer } from "../types/renderer";
import { createLineSource } from "../../sources/line-source";

/**
 * Shared push/flush engine wiring a line source to a renderer. Used by every
 * pipeline; not part of the public API.
 *
 * @param renderer - Line-consuming renderer holding its own target and state.
 * @returns A working pipeline.
 */
export function createPipelineEngine(renderer: MarkdownRenderer): MarkdownPipeline {
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
