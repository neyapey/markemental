import { GFMRenderer, GFMRenderOptions } from "../../renderers/gfm";
import { DOMDocumentLike, DOMNodeLike, RAF } from "../types/dom-like";
import { MarkdownPipeline } from "../types/pipeline"

export function createFrontendGFMPipeline(target: DOMNodeLike, dom: DOMDocumentLike, opts: GFMRenderOptions, raf?: RAF): MarkdownPipeline {
  return new FrontendGFMPipeline(opts);
}

export class FrontendGFMPipeline implements MarkdownPipeline {
  private _renderer: GFMRenderer

  constructor(opts: GFMRenderOptions) {
    this._renderer = new GFMRenderer(opts)
  }

  async push(chunk: string | Promise<string>): Promise<void> {
    void chunk;
    throw new Error("not implemented");
  }

  async flush(): Promise<void> {
    throw new Error("not implemented");
  }
}
