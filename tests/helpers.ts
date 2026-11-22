import { parseHTML } from "linkedom";
import type { DOMDocumentLike, DOMNodeLike, RAF } from "../src/index";

/** linkedom-backed DOM fixture. Casts are test-only: linkedom's own node
 * types satisfy the DOMNodeLike shape structurally at runtime. */
export function makeTestDom(): { document: DOMDocumentLike; target: DOMNodeLike; html: () => string } {
  const { document } = parseHTML("<div></div>");
  const target = document.querySelector("div");
  if (!target) throw new Error("test setup failed");
  return {
    document: document as unknown as DOMDocumentLike,
    target: target as unknown as DOMNodeLike,
    html: () => (target as unknown as { innerHTML: string }).innerHTML,
  };
}

/** Controllable requestAnimationFrame stand-in. */
export function makeTestRaf(): { raf: RAF; runFrames: () => void; pendingFrames: () => number } {
  const callbacks: Array<(time: number) => void> = [];
  return {
    raf: (callback) => {
      callbacks.push(callback);
      return callbacks.length;
    },
    runFrames: () => {
      const pending = callbacks.splice(0, callbacks.length);
      for (const callback of pending) callback(0);
    },
    pendingFrames: () => callbacks.length,
  };
}
