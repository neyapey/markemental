import { GFMRenderer, GFMRenderOptions } from "../../renderers/gfm";
import { createRenderTarget } from "../../targets/render-target";
import { DOMDocumentLike, DOMNodeLike, RAF } from "../types/dom-like";
import { MarkdownPipeline } from "../types/pipeline"
import { createMarkdownPipeline } from "./markdown-pipeline";

/**
 * Create a GFM pipeline rendering into the given container.
 *
 * @remarks
 * The environment is implicit: pass a real browser document for live pages
 * or a simulated one such as linkedom for server-side rendering. Pass a
 * frame scheduler to batch DOM writes on animation frames.
 *
 * @param target - Container node receiving rendered output.
 * @param dom - Document used to create nodes.
 * @param opts - GFM rendering options.
 * @param raf - Optional frame scheduler. When provided, DOM writes are
 * batched on animation frames for smooth streaming.
 * @returns The configured pipeline.
 *
 * @example
 * ```ts
 * const pipeline = createGFMPipeline(
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
export function createGFMPipeline(target: DOMNodeLike, dom: DOMDocumentLike, opts: GFMRenderOptions, raf?: RAF): MarkdownPipeline {
  return new GFMPipeline(target, dom, opts, raf);
}

/**
 * Incremental GFM pipeline.
 *
 * @public
 */
export class GFMPipeline implements MarkdownPipeline {
  private _engine: MarkdownPipeline;

  /**
   * @param target - Container node receiving rendered output.
   * @param dom - Document used to create nodes.
   * @param opts - GFM rendering options.
   * @param raf - Optional frame scheduler for batched DOM writes.
   */
  constructor(target: DOMNodeLike, dom: DOMDocumentLike, opts: GFMRenderOptions, raf?: RAF) {
    this._engine = createMarkdownPipeline(
      new GFMRenderer(createRenderTarget(target, raf), dom, opts),
    );
  }

  /**
   * Push a chunk of markdown into the pipeline.
   *
   * @param chunk - Markdown text, or a promise resolving to markdown text.
   * @returns A promise that resolves once the chunk has been consumed.
   */
  push(chunk: string | Promise<string>): Promise<void> {
    return this._engine.push(chunk);
  }

  /**
   * Render any buffered remainder.
   *
   * @returns A promise that resolves once all output has been flushed.
   */
  flush(): Promise<void> {
    return this._engine.flush();
  }
}
