import { DOMNodeLike } from "./dom-like";

/**
 * Destination for rendered output.
 *
 * @remarks
 * A target receives rendered nodes from a pipeline and attaches them to the
 * host document. Targets decide when attachment happens: immediately, or
 * batched on animation frames for smooth streaming into a live page.
 *
 * @public
 */
export interface RenderTarget {
  /**
   * Attach a rendered node to the target.
   *
   * @param node - Node to attach. Attachment may be deferred (for example to
   * the next animation frame); use {@link RenderTarget.flush} to wait for it.
   */
  append(node: DOMNodeLike): void;
  /**
   * Wait for all appended nodes to be attached.
   *
   * @returns A promise that resolves once the target holds every node.
   */
  flush(): Promise<void>;
}
