import { MarkdownRenderer } from "../core/types/renderer";

export class CommonMarkRenderer implements MarkdownRenderer<CommonMarkRenderOptions> {
  private _opts: CommonMarkRenderOptions
  constructor(opts: CommonMarkRenderOptions) {
    this._opts = opts
  }
}

export type CommonMarkRenderOptions = {

}
