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
