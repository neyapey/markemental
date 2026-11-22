import { CommonMarkRenderer, CommonMarkRenderOptions } from "../../renderers/commonmark";
import { AnimatedDOMTarget } from "../../targets/animated-dom-target";
import { DOMTarget } from "../../targets/dom-target";
import { DOMDocumentLike, DOMNodeLike, RAF } from "../types/dom-like";
import { MarkdownPipeline } from "../types/pipeline"
import { createPipelineEngine } from "./pipeline-engine";

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
  return new FrontendCommonMarkPipeline(target, dom, opts, raf);
}

/**
 * Incremental CommonMark pipeline for browser targets.
 *
 * @public
 */
export class FrontendCommonMarkPipeline implements MarkdownPipeline {
  private _engine: MarkdownPipeline;

  /**
   * @param target - Container node receiving rendered blocks.
   * @param dom - Document used to create nodes.
   * @param opts - CommonMark rendering options.
   * @param raf - Optional frame scheduler for batched DOM writes.
   */
  constructor(target: DOMNodeLike, dom: DOMDocumentLike, opts: CommonMarkRenderOptions, raf?: RAF) {
    this._engine = createPipelineEngine(
      new CommonMarkRenderer(
        raf === undefined ? new DOMTarget(target) : new AnimatedDOMTarget(target, raf),
        dom,
        opts,
      ),
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
