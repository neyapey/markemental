import { describe, expect, it } from "vitest";
import {
  CommonMarkPipeline,
  createCommonMarkPipeline,
  createGFMPipeline,
  GFMPipeline,
} from "../src/index";
import { makeTestDom, makeTestRaf } from "./helpers";

describe("pipeline factories", () => {
  it("creates working pipelines of every flavor", async () => {
    const cases = [
      { create: createGFMPipeline, cls: GFMPipeline },
      { create: createCommonMarkPipeline, cls: CommonMarkPipeline },
    ] as const;
    for (const { create, cls } of cases) {
      const { document, target, html } = makeTestDom();
      // Factories take an optional fourth raf argument; calling without it
      // selects the synchronous target.
      const pipeline = create(target, document, {});
      expect(pipeline).toBeInstanceOf(cls);
      await pipeline.push("# Hi\n\nbody\n");
      await pipeline.flush();
      expect(html()).toBe("<h1>Hi</h1><p>body</p>");
    }
  });
});

describe("incremental rendering", () => {
  it("renders complete blocks per push and holds back the trailing block", async () => {
    const { document, target, html } = makeTestDom();
    const pipeline = createGFMPipeline(target, document, {});
    await pipeline.push("# a\n\n# b\n\n# ");
    expect(html()).toBe("<h1>a</h1>");
    await pipeline.push("c\n");
    expect(html()).toBe("<h1>a</h1><h1>b</h1>");
    await pipeline.flush();
    expect(html()).toBe("<h1>a</h1><h1>b</h1><h1>c</h1>");
  });

  it("holds back an open fence until it closes and completes", async () => {
    const { document, target, html } = makeTestDom();
    const pipeline = createGFMPipeline(target, document, {});
    await pipeline.push("```js\nconst x = 1;\n");
    expect(html()).toBe("");
    await pipeline.push("```\n\nnext\n");
    expect(html()).toBe('<pre><code class="language-js">const x = 1;\n</code></pre>');
    await pipeline.flush();
    expect(html()).toContain("<p>next</p>");
  });

  it("accepts promise chunks", async () => {
    const { document, target, html } = makeTestDom();
    const pipeline = createGFMPipeline(target, document, {});
    await pipeline.push(Promise.resolve("# Hi\n\nbody\n"));
    await pipeline.flush();
    expect(html()).toBe("<h1>Hi</h1><p>body</p>");
  });

  it("rejects pushes after flush", async () => {
    const { document, target } = makeTestDom();
    const pipeline = createGFMPipeline(target, document, {});
    await pipeline.push("# Hi\n");
    await pipeline.flush();
    await expect(pipeline.push("more\n")).rejects.toThrow("push after close");
  });
});

describe("frame-batched target", () => {
  it("batches DOM writes on animation frames", async () => {
    const { document, target, html } = makeTestDom();
    const { raf, runFrames, pendingFrames } = makeTestRaf();
    const pipeline = createGFMPipeline(target, document, {}, raf);
    await pipeline.push("# a\n\n# b\n\ntail\n");
    // Two complete blocks rendered but not yet attached.
    expect(html()).toBe("");
    expect(pendingFrames()).toBe(1);
    runFrames();
    expect(html()).toBe("<h1>a</h1><h1>b</h1>");
    const flushed = pipeline.flush();
    runFrames();
    await flushed;
    expect(html()).toBe("<h1>a</h1><h1>b</h1><p>tail</p>");
  });
});

describe("incremental tables", () => {
  it("commits the table at the delimiter row and streams rows", async () => {
    const { document, target, html } = makeTestDom();
    const pipeline = createGFMPipeline(target, document, {});
    await pipeline.push("| a | b |\n|---|---|\n");
    expect(html()).toBe(
      "<table><thead><tr><th>a</th><th>b</th></tr></thead><tbody></tbody></table>",
    );
    await pipeline.push("| 1 | 2 |\n");
    expect(html()).toContain("<tbody><tr><td>1</td><td>2</td></tr></tbody>");
    await pipeline.push("| 3 | 4 |\n");
    expect(html()).toContain("<td>3</td><td>4</td>");
    await pipeline.push("after\n");
    expect(html()).not.toContain("after");
    await pipeline.flush();
    expect(html()).toContain("<p>after</p>");
  });

  it("treats table syntax as plain paragraph text under CommonMark", async () => {
    const { document, target, html } = makeTestDom();
    const pipeline = createCommonMarkPipeline(target, document, {});
    await pipeline.push("| a | b |\n|---|---|\n| 1 | 2 |\n");
    expect(html()).toBe("");
    await pipeline.push("\ntail\n");
    expect(html()).toBe("<p>| a | b | |---|---| | 1 | 2 |</p>");
    await pipeline.flush();
    expect(html()).toBe("<p>| a | b | |---|---| | 1 | 2 |</p><p>tail</p>");
  });

  it("streams table rows across animation frames", async () => {
    const { document, target, html } = makeTestDom();
    const { raf, runFrames } = makeTestRaf();
    const pipeline = createGFMPipeline(target, document, {}, raf);
    await pipeline.push("| a |\n|---|\n");
    expect(html()).toBe("");
    runFrames();
    expect(html()).toContain("<table>");
    await pipeline.push("| 1 |\n");
    expect(html()).toContain("<td>1</td>");
    const flushed = pipeline.flush();
    runFrames();
    await flushed;
  });
});

describe("incremental lists", () => {
  it("commits list items as they arrive", async () => {
    const { document, target, html } = makeTestDom();
    const pipeline = createGFMPipeline(target, document, {});
    await pipeline.push("- a\n");
    expect(html()).toBe("<ul><li>a</li></ul>");
    await pipeline.push("- b\n");
    expect(html()).toBe("<ul><li>a</li><li>b</li></ul>");
    await pipeline.flush();
    expect(html()).toBe("<ul><li>a</li><li>b</li></ul>");
  });

  it("starts a new list after a blank line", async () => {
    const { document, target, html } = makeTestDom();
    const pipeline = createGFMPipeline(target, document, {});
    await pipeline.push("- a\n\n- b\n");
    await pipeline.flush();
    expect(html()).toBe("<ul><li>a</li></ul><ul><li>b</li></ul>");
  });

  it("closes nested lists on a blank line", async () => {
    const { document, target, html } = makeTestDom();
    const pipeline = createGFMPipeline(target, document, {});
    await pipeline.push("- a\n  - b\n\n- c\n");
    await pipeline.flush();
    expect(html()).toBe("<ul><li>a<ul><li>b</li></ul></li></ul><ul><li>c</li></ul>");
  });
});

describe("nested lists", () => {
  it("nests indented items and returns on dedent", async () => {
    const { document, target, html } = makeTestDom();
    const pipeline = createGFMPipeline(target, document, {});
    await pipeline.push("- a\n  - b\n");
    expect(html()).toBe("<ul><li>a<ul><li>b</li></ul></li></ul>");
    await pipeline.push("- c\n");
    await pipeline.flush();
    expect(html()).toBe("<ul><li>a<ul><li>b</li></ul></li><li>c</li></ul>");
  });

  it("nests ordered lists with mixed markers", async () => {
    const { document, target, html } = makeTestDom();
    const pipeline = createGFMPipeline(target, document, {});
    await pipeline.push("- a\n  1. x\n  2. y\n- b\n");
    await pipeline.flush();
    expect(html()).toBe("<ul><li>a<ol><li>x</li><li>y</li></ol></li><li>b</li></ul>");
  });
});
