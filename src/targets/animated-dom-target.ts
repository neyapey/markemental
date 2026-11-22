import { DOMNodeLike, RAF } from "../core/types/dom-like";
import { RenderTarget } from "../core/types/target";

/**
 * Uses requestAnimationFrame on real DOM
 */
export class AnimatedDOMTarget implements RenderTarget {
  constructor(targetNode: DOMNodeLike, raf: RAF) {

  }
}
