import { DOMNodeLike, RAF } from "../core/types/dom-like";
import { RenderTarget } from "../core/types/target";
import { AnimatedDOMTarget } from "./animated-dom-target";
import { DOMTarget } from "./dom-target";

/**
 * Create the render target for a container node.
 *
 * @param targetNode - Container node receiving rendered output.
 * @param raf - Optional frame scheduler. When provided, writes are batched
 * on animation frames; otherwise nodes are attached synchronously.
 * @returns The target to hand to a renderer.
 *
 * @public
 */
export function createRenderTarget(targetNode: DOMNodeLike, raf?: RAF): RenderTarget {
  return raf === undefined ? new DOMTarget(targetNode) : new AnimatedDOMTarget(targetNode, raf);
}
