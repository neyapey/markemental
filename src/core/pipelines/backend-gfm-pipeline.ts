import { GFMRenderer, GFMRenderOptions } from "../../renderers/gfm";
import { DOMTarget } from "../../targets/dom-target";
import { DOMDocumentLike, DOMNodeLike } from "../types/dom-like";
import { MarkdownPipeline } from "../types/pipeline"
import { createMarkdownPipeline } from "./markdown-pipeline";

/**
 * Create a GFM pipeline for server-side rendering.
 *
 * @remarks
 * Backend pipelines write synchronously and never schedule animation frames.
 * Pair with a lightweight `DOMDocumentLike` such as linkedom.
 *
 * @param target - Container node receiving rendered blocks.
 * @param dom - Document used to create nodes.
 * @param opts - GFM rendering options.
 * @returns The configured pipeline.
 *
 * @example
 * ```ts
 * import { parseHTML } from "linkedom";
 *
 * const { document } = parseHTML("<div></div>");
 * const pipeline = createBackendGFMPipeline(document.querySelector("div"), document, {});
 * await pipeline.push("# Hello\n");
 * await pipeline.flush();
 * ```
 *
 * @public
 */
export function createBackendGFMPipeline(target: DOMNodeLike, dom: DOMDocumentLike, opts: GFMRenderOptions): MarkdownPipeline {
  return new BackendGFMPipeline(target, dom, opts);
}

/**
 * Incremental GFM pipeline for server-side targets.
 *
 * @public
 */
export class BackendGFMPipeline implements MarkdownPipeline {
  private _engine: MarkdownPipeline;

  /**
   * @param target - Container node receiving rendered blocks.
   * @param dom - Document used to create nodes.
   * @param opts - GFM rendering options.
   */
  constructor(target: DOMNodeLike, dom: DOMDocumentLike, opts: GFMRenderOptions) {
    this._engine = createMarkdownPipeline(new GFMRenderer(new DOMTarget(target), dom, opts));
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
