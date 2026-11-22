/**
 * Minimal subset of the DOM `Node` interface that markemental needs.
 *
 * @remarks
 * Both real DOM nodes and lightweight server-side implementations (for
 * example linkedom) satisfy this interface.
 *
 * @public
 */
export interface DOMNodeLike {
  /** Numeric node type, mirroring `Node.nodeType`. */
  nodeType: number;
  /** Text content of this node, mirroring `Node.textContent`. */
  textContent: string | null;
  /** Child nodes, mirroring `Node.childNodes`. */
  childNodes: ArrayLike<DOMNodeLike>;
  /** Owning document, or `null` for detached nodes. */
  ownerDocument: DOMDocumentLike | null;
  /**
   * Append a child node.
   *
   * @param node - Node to append.
   * @returns The appended node.
   */
  appendChild(node: DOMNodeLike): DOMNodeLike;
  /**
   * Insert a node before a reference child.
   *
   * @param newNode - Node to insert.
   * @param referenceNode - Child to insert before, or `null` to append.
   * @returns The inserted node.
   */
  insertBefore(newNode: DOMNodeLike, referenceNode: DOMNodeLike | null): DOMNodeLike;
  /**
   * Remove a child node.
   *
   * @param child - Child to remove.
   * @returns The removed node.
   */
  removeChild(child: DOMNodeLike): DOMNodeLike;
  /**
   * Replace a child node.
   *
   * @param newChild - Replacement node.
   * @param oldChild - Child to replace.
   * @returns The replaced node.
   */
  replaceChild(newChild: DOMNodeLike, oldChild: DOMNodeLike): DOMNodeLike;
  /**
   * Set an attribute on this node, when supported.
   *
   * @param name - Attribute name.
   * @param value - Attribute value.
   */
  setAttribute?(name: string, value: string): void;
  /**
   * Remove an attribute from this node, when supported.
   *
   * @param name - Attribute name.
   */
  removeAttribute?(name: string): void;
}

/**
 * Minimal subset of the DOM `Document` interface that markemental needs.
 *
 * @public
 */
export interface DOMDocumentLike {
  /**
   * Create an element node.
   *
   * @param tagName - Lowercase tag name (for example `"p"`).
   * @returns The new element.
   */
  createElement(tagName: string): DOMNodeLike;
  /**
   * Create a text node.
   *
   * @param data - Text content.
   * @returns The new text node.
   */
  createTextNode(data: string): DOMNodeLike;
}

/**
 * `requestAnimationFrame` callback scheduler.
 *
 * @param callback - Invoked with the frame timestamp.
 * @returns A handle identifying the scheduled frame.
 *
 * @public
 */
export type RAF = (callback: (time: number) => void) => number;
