/**
 * Incremental modular markdown renderer.
 *
 * @packageDocumentation
 */

export type { MarkdownPipeline } from "./core/types/pipeline";
export { createMarkdownPipeline } from "./core/pipelines/markdown-pipeline";
export type { MarkdownRenderer } from "./core/types/renderer";
export type { RenderTarget } from "./core/types/target";
export type { DOMDocumentLike, DOMNodeLike, RAF } from "./core/types/dom-like";
export { createGFMPipeline, GFMPipeline } from "./core/pipelines/gfm-pipeline";
export { createCommonMarkPipeline, CommonMarkPipeline } from "./core/pipelines/commonmark-pipeline";
export { GFMRenderer, type GFMRenderOptions } from "./renderers/gfm";
export { CommonMarkRenderer, type BlockSanitizer, type CommonMarkRenderOptions } from "./renderers/commonmark";
export { createRenderTarget } from "./targets/render-target";
