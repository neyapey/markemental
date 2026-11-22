/**
 * Subset of DOM elements interface that we need
 */
export interface DOMNodeLike {
  nodeType: number;
  textContent: string | null;
  childNodes: ArrayLike<DOMNodeLike>;
  ownerDocument: DOMDocumentLike | null;
  appendChild(node: DOMNodeLike): DOMNodeLike;
  insertBefore(newNode: DOMNodeLike, referenceNode: DOMNodeLike | null): DOMNodeLike;
  removeChild(child: DOMNodeLike): DOMNodeLike;
  replaceChild(newChild: DOMNodeLike, oldChild: DOMNodeLike): DOMNodeLike;
  setAttribute?(name: string, value: string): void;
  removeAttribute?(name: string): void;
}

/**
 * Subset of DOM document api that we need
 */
export interface DOMDocumentLike {
  createElement(tagName: string): DOMNodeLike;
  createTextNode(data: string): DOMNodeLike;
}

/**
 * requestAnimationFrame interface
 */
export type RAF = (callback: (time: number) => void) => number;
