import { DOMNodeLike, RAF } from "../core/types/dom-like";
import { RenderTarget } from "../core/types/target";

/**
 * Target that batches DOM writes on animation frames.
 *
 * @remarks
 * Uses requestAnimationFrame on the real DOM so streamed output lands once
 * per frame instead of once per chunk.
 *
 * @public
 */
export class AnimatedDOMTarget implements RenderTarget {
  /**
   * @param targetNode - Container node receiving rendered output.
   * @param raf - Frame scheduler used to batch writes.
   */
  constructor(targetNode: DOMNodeLike, raf: RAF) {

  }
}
