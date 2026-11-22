import { GFMRenderer, GFMRenderOptions } from "../../renderers/gfm";
import { DOMDocumentLike, DOMNodeLike } from "../types/dom-like";
import { MarkdownPipeline } from "../types/pipeline"

export function createBackendGFMPipeline(target: DOMNodeLike, dom: DOMDocumentLike, opts: GFMRenderOptions): MarkdownPipeline {
  return new BackendGFMPipeline(opts);
}

export class BackendGFMPipeline implements MarkdownPipeline {
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
