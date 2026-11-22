import { MarkdownRenderer } from "../core/types/renderer";

/**
 * Renderer for GitHub Flavored Markdown.
 *
 * @remarks
 * Supports CommonMark blocks and inlines plus GFM tables and strikethrough.
 *
 * @public
 */
export class GFMRenderer implements MarkdownRenderer<GFMRenderOptions> {
  private _opts: GFMRenderOptions
  /**
   * @param opts - GFM rendering options.
   */
  constructor(opts: GFMRenderOptions) {
    this._opts = opts
  }
}

/**
 * Options for {@link GFMRenderer}.
 *
 * @public
 */
export type GFMRenderOptions = {

}
