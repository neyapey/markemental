import { DOMNodeLike } from "../core/types/dom-like";
import { RenderTarget } from "../core/types/target";

/**
 * Target that appends rendered nodes synchronously.
 *
 * @remarks
 * Internal implementation behind `createRenderTarget`. Wraps an externally
 * provided container node from a real or simulated DOM.
 *
 * @internal
 */
export class DOMTarget implements RenderTarget {
  private _targetNode: DOMNodeLike;

  /**
   * @param targetNode - Container node receiving rendered output.
   */
  constructor(targetNode: DOMNodeLike) {
    this._targetNode = targetNode;
  }

  /**
   * Append a rendered node immediately.
   *
   * @param node - Node to attach.
   */
  append(node: DOMNodeLike): void {
    this._targetNode.appendChild(node);
  }

  /**
   * Resolve immediately: synchronous targets hold every node already.
   *
   * @returns A resolved promise.
   */
  flush(): Promise<void> {
    return Promise.resolve();
  }
}
