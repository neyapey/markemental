import { DOMNodeLike } from "./dom-like";

/**
 * Destination for rendered output.
 *
 * @remarks
 * A target receives rendered nodes from a renderer and attaches them to an
 * external DOM: either a real browser document or a simulated one such as
 * linkedom. The caller provides that DOM; the target only decides when
 * attachment happens: immediately, or batched on animation frames for
 * smooth streaming into a live page.
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
