import { DOMDocumentLike } from "../types/dom-like";
import { MarkdownPipeline } from "../types/pipeline";
import { MarkdownRenderer } from "../types/renderer";
import { RenderTarget } from "../types/target";
import { RendererState } from "../../renderers/renderer-state";
import { createLineSource } from "../../sources/line-source";
import { Block } from "../types/block";

/**
 * Shared push/flush engine wiring a line source, parser state, renderer, and
 * target. Used by every pipeline; not part of the public API.
 *
 * @param renderer - Block renderer for the pipeline's flavor.
 * @param target - Destination for rendered nodes.
 * @param dom - Document used to create nodes.
 * @returns A working pipeline.
 */
export function createPipelineEngine(
  renderer: MarkdownRenderer<unknown>,
  target: RenderTarget,
  dom: DOMDocumentLike,
): MarkdownPipeline {
  const source = createLineSource();
  const state = new RendererState();

  function render(blocks: Block[]): void {
    for (const block of blocks) {
      const node = renderer.renderBlock(block, dom);
      if (node !== null) target.append(node);
    }
  }

  return {
    async push(chunk: string | Promise<string>): Promise<void> {
      source.push(await chunk);
      state.addLines(source.readLines());
      render(state.takeCompleteBlocks());
    },
    async flush(): Promise<void> {
      state.addLines(source.close());
      render(state.takeAllBlocks());
      await target.flush();
    },
  };
}
