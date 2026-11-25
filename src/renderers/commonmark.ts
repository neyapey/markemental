import { Block } from "../core/types/block";
import { DOMDocumentLike, DOMNodeLike } from "../core/types/dom-like";
import { MarkdownRenderer } from "../core/types/renderer";
import { RenderTarget } from "../core/types/target";
import { CommonMarkState, type ParseFragment } from "./renderer-state";
import { appendInline } from "./parser/inline";

/** An open list waiting for more items (possibly nested). */
interface OpenListFrame {
  /** Committed list element items append to. */
  node: DOMNodeLike;
  /** Latest item; nested lists open inside it. Null until the first item. */
  currentItem: DOMNodeLike | null;
}

/**
 * Renderer for CommonMark.
 *
 * @remarks
 * Constructed with its target, document, and options. Feed it lines with
 * {@link CommonMarkRenderer.writeLine}; it holds its own parse state and
 * writes finished blocks to the target as they complete. An optional
 * `sanitizer` post-processes every committed node. Open lists are tracked
 * on a commit stack so items — including nested ones — append to the right
 * container as they arrive.
 *
 * @public
 */
export class CommonMarkRenderer implements MarkdownRenderer {
  /** Rendering options. */
  readonly options: CommonMarkRenderOptions;
  private _target: RenderTarget;
  protected _doc: DOMDocumentLike;
  private _state: CommonMarkState;
  private _open: OpenListFrame[] = [];

  /**
   * @param target - Destination for rendered output, from
   * `createRenderTarget`. Pass `requestAnimationFrame` there to batch
   * writes on animation frames, or nothing for synchronous writes.
   * @param doc - Document used to create nodes.
   * @param opts - CommonMark rendering options.
   */
  constructor(target: RenderTarget, doc: DOMDocumentLike, opts: CommonMarkRenderOptions) {
    this._target = target;
    this._doc = doc;
    this.options = opts;
    this._state = this._createState((fragment) => this._applyFragment(fragment));
  }

  /**
   * Create the parser state. Overridden by {@link GFMRenderer} to parse
   * tables.
   *
   * @param emit - Receives parse fragments in document order.
   * @returns The state for this renderer.
   */
  protected _createState(emit: (fragment: ParseFragment) => void): CommonMarkState {
    return new CommonMarkState(emit);
  }

  /**
   * Feed one source line; completed output is written to the target.
   *
   * @param line - Next source line, without its line break.
   */
  writeLine(line: string): void {
    this._state.addLine(line);
  }

  /**
   * Render the buffered remainder and settle the target.
   *
   * @returns A promise that resolves once all output has landed in the target.
   */
  async flush(): Promise<void> {
    this._state.flush();
    await this._target.flush();
  }

  protected _applyFragment(fragment: ParseFragment): void {
    switch (fragment.kind) {
      case "block": {
        const node = this.renderBlock(fragment.block, this._doc);
        if (node !== null) this._commit(node, null);
        break;
      }
      case "listStart": {
        const top = this._open[this._open.length - 1];
        const list = this._doc.createElement(fragment.ordered ? "ol" : "ul");
        this._commit(list, top?.currentItem ?? null);
        this._open.push({ node: list, currentItem: null });
        break;
      }
      case "listItem": {
        const top = this._open[this._open.length - 1] as OpenListFrame;
        const item = this._doc.createElement("li");
        appendInline(item, fragment.text, this._doc, this.inlineGfm());
        this._commit(item, top.node);
        top.currentItem = item;
        break;
      }
      case "listEnd":
        this._open.pop();
        break;
      default:
        // Table fragments never reach CommonMark: CommonMarkState never
        // emits them.
        break;
    }
  }

  /**
   * Append a node to the target (top level) or to its parent container,
   * running the sanitizer first when one is set.
   *
   * @param node - Node to commit.
   * @param parent - Parent container, or null to commit to the target.
   */
  protected _commit(node: DOMNodeLike, parent: DOMNodeLike | null): void {
    const sanitizer = this.options.sanitizer;
    const out = sanitizer === undefined ? node : sanitizer(node);
    if (parent === null) this._target.append(out);
    else parent.appendChild(out);
  }

  /**
   * Whether GFM-only inlines are enabled. Always false here; overridden by
   * {@link GFMRenderer}.
   *
   * @returns False.
   */
  protected inlineGfm(): boolean {
    return false;
  }

  /**
   * Render one block to a DOM-like node.
   *
   * @param block - Parsed block to render.
   * @param doc - Document used to create nodes.
   * @returns The rendered node, or `null` to emit nothing.
   */
  protected renderBlock(block: Block, doc: DOMDocumentLike): DOMNodeLike | null {
    switch (block.kind) {
      case "heading": {
        const heading = doc.createElement(`h${block.level ?? 1}`);
        this.appendLinesInline(heading, block.lines, doc, " ");
        return heading;
      }
      case "paragraph":
        return this.renderParagraph(block.lines, doc);
      case "fence": {
        const pre = doc.createElement("pre");
        const code = doc.createElement("code");
        if (block.language !== undefined) code.setAttribute?.("class", `language-${block.language}`);
        const text = block.lines.join("\n");
        code.appendChild(doc.createTextNode(text === "" ? "" : `${text}\n`));
        pre.appendChild(code);
        return pre;
      }
      case "quote": {
        const quote = doc.createElement("blockquote");
        const body = doc.createElement("p");
        this.appendLinesInline(body, block.lines, doc, " ");
        quote.appendChild(body);
        return quote;
      }
      case "rule":
        return doc.createElement("hr");
    }
  }

  /**
   * Render paragraph lines, honoring two-space hard breaks.
   *
   * @param lines - Raw paragraph lines.
   * @param doc - Document used to create nodes.
   * @returns The paragraph element.
   */
  protected renderParagraph(lines: string[], doc: DOMDocumentLike): DOMNodeLike {
    const paragraph = doc.createElement("p");
    lines.forEach((line, at) => {
      const hardBreak = / {2,}$/.test(line);
      appendInline(paragraph, hardBreak ? line.replace(/ {2,}$/, "") : line, doc, this.inlineGfm());
      if (at < lines.length - 1) {
        if (hardBreak) paragraph.appendChild(doc.createElement("br"));
        else paragraph.appendChild(doc.createTextNode(" "));
      }
    });
    return paragraph;
  }

  private appendLinesInline(parent: DOMNodeLike, lines: string[], doc: DOMDocumentLike, join: string): void {
    lines.forEach((line, at) => {
      if (at > 0) parent.appendChild(doc.createTextNode(join));
      appendInline(parent, line, doc, this.inlineGfm());
    });
  }
}

/**
 * Sanitizes one node committed to the target.
 *
 * @remarks
 * Applied to every node as it commits: leaf blocks whole, tables and lists
 * piece by piece (container first, then rows and items).
 *
 * @param node - Node being committed.
 * @returns The node to append to the target.
 *
 * @public
 */
export type BlockSanitizer = (node: DOMNodeLike) => DOMNodeLike;

/**
 * Options for {@link CommonMarkRenderer}.
 *
 * @public
 */
export type CommonMarkRenderOptions = {
  /**
   * Optional post-render sanitizer applied to every node committed to the
   * target.
   *
   * @remarks
   * Intended for HTML safety once raw HTML detection and parsing lands
   * (see the TODO in `parser/inline`).
   */
  sanitizer?: BlockSanitizer;
};
