import { CommonMarkRenderer, CommonMarkRenderOptions } from "../../renderers/commonmark";
import { DOMDocumentLike, DOMNodeLike } from "../types/dom-like";
import { MarkdownPipeline } from "../types/pipeline"

export function createBackendCommonMarkPipeline(target: DOMNodeLike, dom: DOMDocumentLike, opts: CommonMarkRenderOptions): MarkdownPipeline {
  return new BackendCommonMarkPipeline(opts);
}

export class BackendCommonMarkPipeline implements MarkdownPipeline {
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
