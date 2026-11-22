import { MarkdownRenderer } from "../core/types/renderer";

/**
 * Renderer for CommonMark.
 *
 * @public
 */
export class CommonMarkRenderer implements MarkdownRenderer<CommonMarkRenderOptions> {
  private _opts: CommonMarkRenderOptions
  /**
   * @param opts - CommonMark rendering options.
   */
  constructor(opts: CommonMarkRenderOptions) {
    this._opts = opts
  }
}

/**
 * Options for {@link CommonMarkRenderer}.
 *
 * @public
 */
export type CommonMarkRenderOptions = {

}
