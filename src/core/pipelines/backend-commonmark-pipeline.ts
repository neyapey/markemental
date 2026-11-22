import { CommonMarkRenderer, CommonMarkRenderOptions } from "../../renderers/commonmark";
import { DOMDocumentLike, DOMNodeLike } from "../types/dom-like";
import { MarkdownPipeline } from "../types/pipeline"

/**
 * Create a CommonMark pipeline for server-side rendering.
 *
 * @remarks
 * Backend pipelines write synchronously and never schedule animation frames.
 * Pair with a lightweight `DOMDocumentLike` such as linkedom.
 *
 * @param target - Container node receiving rendered blocks.
 * @param dom - Document used to create nodes.
 * @param opts - CommonMark rendering options.
 * @returns The configured pipeline.
 *
 * @example
 * ```ts
 * import { parseHTML } from "linkedom";
 *
 * const { document } = parseHTML("<div></div>");
 * const pipeline = createBackendCommonMarkPipeline(document.querySelector("div"), document, {});
 * await pipeline.push("# Hello\n");
 * await pipeline.flush();
 * ```
 *
 * @public
 */
export function createBackendCommonMarkPipeline(target: DOMNodeLike, dom: DOMDocumentLike, opts: CommonMarkRenderOptions): MarkdownPipeline {
  return new BackendCommonMarkPipeline(opts);
}

/**
 * Incremental CommonMark pipeline for server-side targets.
 *
 * @public
 */
export class BackendCommonMarkPipeline implements MarkdownPipeline {
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
