import { describe, expect, it } from "vitest";
import { createCommonMarkPipeline } from "../src/index";
import { makeTestDom } from "./helpers";

async function render(markdown: string): Promise<string> {
  const { document, target, html } = makeTestDom();
  const pipeline = createCommonMarkPipeline(target, document, {});
  await pipeline.push(markdown);
  await pipeline.flush();
  return html();
}

describe("commonmark blocks", () => {
  it("renders headings with levels", async () => {
    await expect(render("# One\n")).resolves.toBe("<h1>One</h1>");
    await expect(render("### Three\n")).resolves.toBe("<h3>Three</h3>");
    await expect(render("###### Six\n")).resolves.toBe("<h6>Six</h6>");
  });

  it("joins paragraph lines with spaces", async () => {
    await expect(render("hello\nworld\n")).resolves.toBe("<p>hello world</p>");
  });

  it("turns two trailing spaces into hard breaks", async () => {
    const out = await render("hello  \nworld\n");
    expect(out).toContain("<br");
    expect(out.startsWith("<p>hello")).toBe(true);
  });

  it("renders fenced code with an optional language class", async () => {
    await expect(render("```js\nconst x = 1;\n```\n")).resolves.toBe(
      '<pre><code class="language-js">const x = 1;\n</code></pre>',
    );
    await expect(render("```\nplain\n```\n")).resolves.toBe("<pre><code>plain\n</code></pre>");
  });

  it("renders an unclosed fence at flush", async () => {
    await expect(render("```\nbody\n")).resolves.toBe("<pre><code>body\n</code></pre>");
  });

  it("renders bullet and ordered lists", async () => {
    await expect(render("- a\n- b\n")).resolves.toBe("<ul><li>a</li><li>b</li></ul>");
    await expect(render("1. one\n2. two\n")).resolves.toBe("<ol><li>one</li><li>two</li></ol>");
    await expect(render("1) one\n2) two\n")).resolves.toBe("<ol><li>one</li><li>two</li></ol>");
  });

  it("renders multi-line quotes", async () => {
    await expect(render("> quote\n> more\n")).resolves.toBe("<blockquote><p>quote more</p></blockquote>");
  });

  it("renders thematic breaks", async () => {
    for (const rule of ["---\n", "***\n", "___\n"]) {
      expect(await render(rule)).toContain("<hr");
    }
  });

  it("renders nothing for empty input", async () => {
    await expect(render("")).resolves.toBe("");
    await expect(render("\n\n")).resolves.toBe("");
  });
});

describe("commonmark inlines", () => {
  it("renders emphasis and strong emphasis", async () => {
    await expect(render("**bold** and *italic*\n")).resolves.toBe(
      "<p><strong>bold</strong> and <em>italic</em></p>",
    );
    await expect(render("__bold__ and _italic_\n")).resolves.toBe(
      "<p><strong>bold</strong> and <em>italic</em></p>",
    );
  });

  it("leaves underscores inside words alone", async () => {
    await expect(render("snake_case stays\n")).resolves.toBe("<p>snake_case stays</p>");
  });

  it("renders links, titled links, and images", async () => {
    await expect(render('[text](https://x.y)\n')).resolves.toBe('<p><a href="https://x.y">text</a></p>');
    const titled = await render('[text](https://x.y "title")\n');
    expect(titled).toContain('href="https://x.y"');
    const img = await render("![alt](pic.png)\n");
    expect(img).toContain("<img");
    expect(img).toContain('src="pic.png"');
    expect(img).toContain('alt="alt"');
  });

  it("renders code spans and autolinks", async () => {
    await expect(render("use `x()` here\n")).resolves.toBe("<p>use <code>x()</code> here</p>");
    await expect(render("<https://x.y>\n")).resolves.toBe('<p><a href="https://x.y">https://x.y</a></p>');
  });

  it("leaves unmatched syntax literal", async () => {
    await expect(render("a ` b ** c\n")).resolves.toBe("<p>a ` b ** c</p>");
    await expect(render("[nope](\n")).resolves.toBe("<p>[nope](</p>");
  });

  it("honors backslash escapes", async () => {
    await expect(render("\\*literal\\*\n")).resolves.toBe("<p>*literal*</p>");
  });
});

describe("input tolerance", () => {
  it("handles CRLF line endings", async () => {
    await expect(render("# Hi\r\n\r\nx\r\n")).resolves.toBe("<h1>Hi</h1><p>x</p>");
  });
});
