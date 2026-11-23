import { describe, expect, it } from "vitest";
import { createCommonMarkPipeline, createGFMPipeline, type BlockSanitizer } from "../src/index";
import { makeTestDom } from "./helpers";

async function renderGfm(markdown: string): Promise<string> {
  const { document, target, html } = makeTestDom();
  const pipeline = createGFMPipeline(target, document, {});
  await pipeline.push(markdown);
  await pipeline.flush();
  return html();
}

describe("gfm tables", () => {
  it("renders header, delimiter, and body rows", async () => {
    const out = await renderGfm("| a | b |\n|---|---|\n| 1 | 2 |\n");
    expect(out).toBe(
      "<table><thead><tr><th>a</th><th>b</th></tr></thead>" +
        "<tbody><tr><td>1</td><td>2</td></tr></tbody></table>",
    );
  });

  it("applies column alignment from the delimiter row", async () => {
    const out = await renderGfm("| l | c | r |\n|:--|:--:|--:|\n| 1 | 2 | 3 |\n");
    expect(out).toContain('<th align="left">l</th>');
    expect(out).toContain('<th align="center">c</th>');
    expect(out).toContain('<th align="right">r</th>');
    expect(out).toContain('<td align="center">2</td>');
  });

  it("pads ragged rows with empty cells", async () => {
    const out = await renderGfm("| a | b |\n|---|---|\n| 1 |\n");
    expect(out).toContain("<td>1</td><td></td>");
  });

  it("parses inlines inside cells", async () => {
    const out = await renderGfm("| **h** |\n|---|\n| `c` |\n");
    expect(out).toContain("<th><strong>h</strong></th>");
    expect(out).toContain("<td><code>c</code></td>");
  });
});

describe("gfm strikethrough", () => {
  it("renders deleted text", async () => {
    await expect(renderGfm("~~struck~~\n")).resolves.toBe("<p><del>struck</del></p>");
  });

  it("stays literal under CommonMark", async () => {
    const { document, target, html } = makeTestDom();
    const pipeline = createCommonMarkPipeline(target, document, {});
    await pipeline.push("~~struck~~\n");
    await pipeline.flush();
    expect(html()).toBe("<p>~~struck~~</p>");
  });
});

describe("gfm graceful degradation", () => {
  it("renders tables as paragraphs under CommonMark", async () => {
    const { document, target, html } = makeTestDom();
    const pipeline = createCommonMarkPipeline(target, document, {});
    await pipeline.push("| a | b |\n|---|---|\n| 1 | 2 |\n");
    await pipeline.flush();
    expect(html()).not.toContain("<table");
    expect(html().startsWith("<p>")).toBe(true);
  });

  it("keeps CommonMark blocks working under GFM", async () => {
    await expect(renderGfm("# Hi\n\n- a\n- b\n")).resolves.toBe(
      "<h1>Hi</h1><ul><li>a</li><li>b</li></ul>",
    );
  });
});

describe("gfm sanitizer", () => {
  it("passes every rendered block node through the sanitizer", async () => {
    const { document, target, html } = makeTestDom();
    const seen: Array<string | null> = [];
    const sanitizer: BlockSanitizer = (node) => {
      seen.push(node.textContent);
      return node;
    };
    const pipeline = createGFMPipeline(target, document, { sanitizer });
    await pipeline.push("# a\n\nb\n");
    await pipeline.flush();
    expect(seen).toEqual(["a", "b"]);
    expect(html()).toBe("<h1>a</h1><p>b</p>");
  });

  it("appends the node returned by the sanitizer", async () => {
    const { document, target, html } = makeTestDom();
    const pipeline = createGFMPipeline(target, document, {
      sanitizer: () => document.createTextNode("[redacted]"),
    });
    await pipeline.push("# a\n\nb\n");
    await pipeline.flush();
    expect(html()).toBe("[redacted][redacted]");
  });

  it("sanitizes GFM tables", async () => {
    const { document, target, html } = makeTestDom();
    const seen: Array<string | null> = [];
    const pipeline = createGFMPipeline(target, document, {
      sanitizer: (node) => {
        seen.push(node.textContent);
        return node;
      },
    });
    await pipeline.push("| a |\n|---|\n| 1 |\n");
    await pipeline.flush();
    expect(seen).toEqual(["a1"]);
    expect(html()).toContain("<table>");
  });
});
