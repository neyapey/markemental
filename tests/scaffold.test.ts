import { describe, expect, it } from "vitest";
import {
  AnimatedDOMTarget,
  CommonMarkRenderer,
  createFrontendGFMPipeline,
  createLineSource,
  DOMTarget,
  FrontendGFMPipeline,
  GFMRenderer,
  RendererState,
} from "../src/index";

describe("public api scaffold", () => {
  it("exposes the documented entry points", () => {
    expect(createFrontendGFMPipeline).toBeTypeOf("function");
    expect(createLineSource).toBeTypeOf("function");
    for (const cls of [
      FrontendGFMPipeline,
      GFMRenderer,
      CommonMarkRenderer,
      RendererState,
      DOMTarget,
      AnimatedDOMTarget,
    ]) {
      expect(cls).toBeTypeOf("function");
    }
  });

  it("creates a frontend GFM pipeline implementing push/flush", () => {
    const target = {
      nodeType: 1,
      textContent: null,
      childNodes: [],
      ownerDocument: null,
      appendChild: (n: never) => n,
      insertBefore: (n: never) => n,
      removeChild: (n: never) => n,
      replaceChild: (n: never) => n,
    };
    const dom = {
      createElement: () => target,
      createTextNode: () => target,
    };
    const pipeline = createFrontendGFMPipeline(target, dom, {});
    expect(pipeline).toBeInstanceOf(FrontendGFMPipeline);
    expect(pipeline.push).toBeTypeOf("function");
    expect(pipeline.flush).toBeTypeOf("function");
  });
});
