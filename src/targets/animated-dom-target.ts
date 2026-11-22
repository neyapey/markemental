import { DOMNodeLike, RAF } from "../core/types/dom-like";
import { RenderTarget } from "../core/types/target";

/**
 * Target that batches DOM writes on animation frames.
 *
 * @remarks
 * Wraps an externally provided container node from a real DOM. Uses the
 * injected frame scheduler so streamed output lands once per frame instead
 * of once per chunk.
 *
 * Internal implementation behind `createRenderTarget`.
 *
 * @internal
 */
export class AnimatedDOMTarget implements RenderTarget {
  private _targetNode: DOMNodeLike;
  private _raf: RAF;
  private _queue: DOMNodeLike[] = [];
  private _scheduled = false;
  private _flushResolvers: Array<() => void> = [];

  /**
   * @param targetNode - Container node receiving rendered output.
   * @param raf - Frame scheduler used to batch writes.
   */
  constructor(targetNode: DOMNodeLike, raf: RAF) {
    this._targetNode = targetNode;
    this._raf = raf;
  }

  /**
   * Queue a rendered node for the next frame.
   *
   * @param node - Node to attach.
   */
  append(node: DOMNodeLike): void {
    this._queue.push(node);
    if (!this._scheduled) {
      this._scheduled = true;
      this._raf(() => {
        this._scheduled = false;
        const batch = this._queue;
        this._queue = [];
        for (const queued of batch) this._targetNode.appendChild(queued);
        const resolvers = this._flushResolvers;
        this._flushResolvers = [];
        for (const resolve of resolvers) resolve();
      });
    }
  }

  /**
   * Wait until every queued node has been attached.
   *
   * @returns A promise that resolves after the next frame carrying nodes.
   */
  flush(): Promise<void> {
    if (!this._scheduled && this._queue.length === 0) return Promise.resolve();
    return new Promise((resolve) => {
      this._flushResolvers.push(resolve);
    });
  }
}
