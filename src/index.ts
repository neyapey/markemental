/**
 * Incremental modular markdown renderer.
 *
 * @packageDocumentation
 */

export type { Block, BlockKind } from "./core/types/block";
export type { MarkdownPipeline } from "./core/types/pipeline";
export type { MarkdownRenderer } from "./core/types/renderer";
export type { LineSource } from "./core/types/source";
export type { RenderTarget } from "./core/types/target";
export type { DOMDocumentLike, DOMNodeLike, RAF } from "./core/types/dom-like";
export { createFrontendGFMPipeline, FrontendGFMPipeline } from "./core/pipelines/frontend-gfm-pipeline";
export { createFrontendCommonMarkPipeline, FrontendCommonMarkPipeline } from "./core/pipelines/frontend-commonmark-pipeline";
export { createBackendGFMPipeline, BackendGFMPipeline } from "./core/pipelines/backend-gfm-pipeline";
export { createBackendCommonMarkPipeline, BackendCommonMarkPipeline } from "./core/pipelines/backend-commonmark-pipeline";
export { GFMRenderer, type GFMRenderOptions } from "./renderers/gfm";
export { CommonMarkRenderer, type CommonMarkRenderOptions } from "./renderers/commonmark";
export { RendererState } from "./renderers/renderer-state";
export { createLineSource } from "./sources/line-source";
export { DOMTarget } from "./targets/dom-target";
export { AnimatedDOMTarget } from "./targets/animated-dom-target";
