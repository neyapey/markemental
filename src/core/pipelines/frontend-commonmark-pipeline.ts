import { CommonMarkRenderer, CommonMarkRenderOptions } from "../../renderers/commonmark";
import { DOMDocumentLike, DOMNodeLike, RAF } from "../types/dom-like";
import { MarkdownPipeline } from "../types/pipeline"

export function createFrontendCommonMarkPipeline(target: DOMNodeLike, dom: DOMDocumentLike, opts: CommonMarkRenderOptions, raf?: RAF): MarkdownPipeline {
  return new FrontendCommonMarkPipeline(opts);
}

export class FrontendCommonMarkPipeline implements MarkdownPipeline {
  private _renderer: CommonMarkRenderer

  constructor(opts: CommonMarkRenderOptions) {
    this._renderer = new CommonMarkRenderer(opts)
  }

  async push(chunk: string | Promise<string>): Promise<void> {
    void chunk;
    throw new Error("not implemented");
  }

  async flush(): Promise<void> {
    throw new Error("not implemented");
  }
}
