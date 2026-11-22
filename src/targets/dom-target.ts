import { DOMNodeLike } from "../core/types/dom-like";
import { RenderTarget } from "../core/types/target";

/**
 * Target that appends rendered nodes synchronously.
 *
 * @public
 */
export class DOMTarget implements RenderTarget {
  /**
   * @param targetNode - Container node receiving rendered output.
   */
  constructor(targetNode: DOMNodeLike) {

 }
}
