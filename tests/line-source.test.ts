import { describe, expect, it } from "vitest";
import { createLineSource } from "../src/sources/line-source";

describe("line source", () => {
  it("splits lines across chunk boundaries", () => {
    const source = createLineSource();
    source.push("ab");
    expect(source.readLines()).toEqual([]);
    source.push("c\nde\n");
    expect(source.readLines()).toEqual(["abc", "de"]);
    source.push("f");
    expect(source.readLines()).toEqual([]);
    expect(source.close()).toEqual(["f"]);
  });

  it("strips carriage returns", () => {
    const source = createLineSource();
    source.push("a\r\nb\r\n");
    expect(source.readLines()).toEqual(["a", "b"]);
  });

  it("closes empty when nothing is buffered", () => {
    const source = createLineSource();
    source.push("a\n");
    expect(source.readLines()).toEqual(["a"]);
    expect(source.close()).toEqual([]);
    expect(source.close()).toEqual([]);
  });

  it("rejects pushes after close", () => {
    const source = createLineSource();
    source.close();
    expect(() => source.push("x")).toThrow("push after close");
  });
});
