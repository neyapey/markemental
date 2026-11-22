import { CommonMarkRenderer, CommonMarkRenderOptions } from "../../renderers/commonmark";
import { DOMTarget } from "../../targets/dom-target";
import { DOMDocumentLike, DOMNodeLike } from "../types/dom-like";
import { MarkdownPipeline } from "../types/pipeline"
import { createMarkdownPipeline } from "./markdown-pipeline";

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
  return new BackendCommonMarkPipeline(target, dom, opts);
}

/**
 * Incremental CommonMark pipeline for server-side targets.
 *
 * @public
 */
export class BackendCommonMarkPipeline implements MarkdownPipeline {
  private _engine: MarkdownPipeline;

  /**
   * @param target - Container node receiving rendered blocks.
   * @param dom - Document used to create nodes.
   * @param opts - CommonMark rendering options.
   */
  constructor(target: DOMNodeLike, dom: DOMDocumentLike, opts: CommonMarkRenderOptions) {
    this._engine = createMarkdownPipeline(new CommonMarkRenderer(new DOMTarget(target), dom, opts));
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
