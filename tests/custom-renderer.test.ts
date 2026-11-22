import { describe, expect, it } from "vitest";
import {
  createMarkdownPipeline,
  createRenderTarget,
  type DOMDocumentLike,
  type DOMNodeLike,
  type MarkdownRenderer,
  type RenderTarget,
} from "../src/index";
import { makeTestDom, makeTestRaf } from "./helpers";

/** Minimal user-provided renderer: one paragraph per non-blank line. */
class LineParagraphRenderer implements MarkdownRenderer {
  private _target: RenderTarget;
  private _doc: DOMDocumentLike;

  constructor(target: RenderTarget, doc: DOMDocumentLike) {
    this._target = target;
    this._doc = doc;
  }

  writeLine(line: string): void {
    if (line.trim() === "") return;
    const paragraph = this._doc.createElement("p");
    paragraph.appendChild(this._doc.createTextNode(line));
    this._target.append(paragraph);
  }

  async flush(): Promise<void> {
    await this._target.flush();
  }
}

/** Fully custom target: collects nodes instead of attaching them to a DOM. */
class CollectingTarget implements RenderTarget {
  readonly nodes: DOMNodeLike[] = [];

  append(node: DOMNodeLike): void {
    this.nodes.push(node);
  }

  flush(): Promise<void> {
    return Promise.resolve();
  }
}

describe("user-provided renderer", () => {
  it("renders through createMarkdownPipeline with a DOM target", async () => {
    const { document, target, html } = makeTestDom();
    const pipeline = createMarkdownPipeline(
      new LineParagraphRenderer(createRenderTarget(target), document),
    );
    await pipeline.push("hello\nwor");
    expect(html()).toBe("<p>hello</p>");
    await pipeline.push("ld\n\nbye\n");
    await pipeline.flush();
    expect(html()).toBe("<p>hello</p><p>world</p><p>bye</p>");
  });

  it("composes with a frame-batched target", async () => {
    const { document, target, html } = makeTestDom();
    const { raf, runFrames, pendingFrames } = makeTestRaf();
    const pipeline = createMarkdownPipeline(
      new LineParagraphRenderer(createRenderTarget(target, raf), document),
    );
    await pipeline.push("a\nb\n");
    expect(html()).toBe("");
    expect(pendingFrames()).toBe(1);
    runFrames();
    expect(html()).toBe("<p>a</p><p>b</p>");
    await pipeline.flush();
  });

  it("works with a fully custom target", async () => {
    const { document } = makeTestDom();
    const collecting = new CollectingTarget();
    const pipeline = createMarkdownPipeline(new LineParagraphRenderer(collecting, document));
    await pipeline.push("x\ny\n");
    await pipeline.flush();
    expect(collecting.nodes.map((node) => node.textContent)).toEqual(["x", "y"]);
  });
});
