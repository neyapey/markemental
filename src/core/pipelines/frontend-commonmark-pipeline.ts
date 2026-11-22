import { CommonMarkRenderer, CommonMarkRenderOptions } from "../../renderers/commonmark";
import { DOMDocumentLike, DOMNodeLike, RAF } from "../types/dom-like";
import { MarkdownPipeline } from "../types/pipeline"

/**
 * Create a CommonMark pipeline that renders into a live page.
 *
 * @param target - Container node receiving rendered blocks.
 * @param dom - Document used to create nodes.
 * @param opts - CommonMark rendering options.
 * @param raf - Optional frame scheduler. When provided, DOM writes are
 * batched on animation frames for smooth streaming.
 * @returns The configured pipeline.
 *
 * @example
 * ```ts
 * const pipeline = createFrontendCommonMarkPipeline(
 *   document.getElementById("out"),
 *   document,
 *   {},
 *   requestAnimationFrame,
 * );
 * await pipeline.push("# Hello\n");
 * await pipeline.flush();
 * ```
 *
 * @public
 */
export function createFrontendCommonMarkPipeline(target: DOMNodeLike, dom: DOMDocumentLike, opts: CommonMarkRenderOptions, raf?: RAF): MarkdownPipeline {
  return new FrontendCommonMarkPipeline(opts);
}

/**
 * Incremental CommonMark pipeline for browser targets.
 *
 * @public
 */
export class FrontendCommonMarkPipeline implements MarkdownPipeline {
  private _renderer: CommonMarkRenderer

  /**
   * @param opts - CommonMark rendering options.
   */
  constructor(opts: CommonMarkRenderOptions) {
    this._renderer = new CommonMarkRenderer(opts)
  }

  /**
   * Push a chunk of markdown into the pipeline.
   *
   * @param chunk - Markdown text, or a promise resolving to markdown text.
   * @returns A promise that resolves once the chunk has been consumed.
   */
  async push(chunk: string | Promise<string>): Promise<void> {
    void chunk;
    throw new Error("not implemented");
  }

  /**
   * Render any buffered remainder.
   *
   * @returns A promise that resolves once all output has been flushed.
   */
  async flush(): Promise<void> {
    throw new Error("not implemented");
  }
}
