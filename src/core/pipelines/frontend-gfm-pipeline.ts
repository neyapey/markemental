import { GFMRenderer, GFMRenderOptions } from "../../renderers/gfm";
import { DOMDocumentLike, DOMNodeLike, RAF } from "../types/dom-like";
import { MarkdownPipeline } from "../types/pipeline"

/**
 * Create a GFM pipeline that renders into a live page.
 *
 * @param target - Container node receiving rendered blocks.
 * @param dom - Document used to create nodes.
 * @param opts - GFM rendering options.
 * @param raf - Optional frame scheduler. When provided, DOM writes are
 * batched on animation frames for smooth streaming.
 * @returns The configured pipeline.
 *
 * @example
 * ```ts
 * const pipeline = createFrontendGFMPipeline(
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
export function createFrontendGFMPipeline(target: DOMNodeLike, dom: DOMDocumentLike, opts: GFMRenderOptions, raf?: RAF): MarkdownPipeline {
  return new FrontendGFMPipeline(opts);
}

/**
 * Incremental GFM pipeline for browser targets.
 *
 * @public
 */
export class FrontendGFMPipeline implements MarkdownPipeline {
  private _renderer: GFMRenderer

  /**
   * @param opts - GFM rendering options.
   */
  constructor(opts: GFMRenderOptions) {
    this._renderer = new GFMRenderer(opts)
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
