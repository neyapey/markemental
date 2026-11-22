import { MarkdownRenderer } from "../core/types/renderer";

export class GFMRenderer implements MarkdownRenderer<GFMRenderOptions> {
  private _opts: GFMRenderOptions
  constructor(opts: GFMRenderOptions) {
    this._opts = opts
  }
}

export type GFMRenderOptions = {

}
