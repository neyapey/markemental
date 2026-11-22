import { Block } from "./block";
import { DOMDocumentLike, DOMNodeLike } from "./dom-like";

/**
 * Renders parsed markdown to DOM-like nodes.
 *
 * @typeParam Opts - Renderer-specific options.
 *
 * @public
 */
export interface MarkdownRenderer<Opts> {
  /** Renderer-specific options. */
  readonly options: Opts;
  /**
   * Render one block to a DOM-like node.
   *
   * @param block - Parsed block to render.
   * @param doc - Document used to create nodes.
   * @returns The rendered node, or `null` to emit nothing.
   */
  renderBlock(block: Block, doc: DOMDocumentLike): DOMNodeLike | null;
}
