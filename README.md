# markemental

> **Note:** This project is still under active development. APIs may change between releases.

Incremental modular markdown renderer. Push markdown in arbitrarily-sized chunks and complete blocks render to the target as they arrive, instead of waiting for the full document.

Two pipelines cover the GFM/CommonMark flavors, and the environment is implicit: the same code drives a live page in the browser and lightweight DOMs like linkedom on the server through a minimal `DOMNodeLike` interface.

## Features

- Streaming input: `push()` chunks as they arrive, `flush()` the remainder.
- Incremental commit: tables render row-by-row from the delimiter row on, and lists item-by-item, instead of waiting for the whole block.
- Blocks: headings, paragraphs, fenced code, bullet and ordered lists, blockquotes, thematic breaks.
- Inlines: emphasis, strong, inline code, links, images, autolinks, escapes, hard breaks.
- GFM extras: tables (with column alignment) and strikethrough; CommonMark pipelines degrade tables to paragraphs.
- Pipelines batch DOM writes on `requestAnimationFrame` when given a scheduler.

## Install

```sh
npm install markemental
```

Server-side rendering also needs a DOM implementation:

```sh
npm install linkedom
```

## Usage

Render a streamed response into a live page:

```ts
import { createGFMPipeline } from "markemental";

const pipeline = createGFMPipeline(
  document.getElementById("out")!,
  document,
  {},
  requestAnimationFrame,
);

for await (const chunk of streamResponse()) {
  await pipeline.push(chunk);
}
await pipeline.flush();
```

Render on the server with linkedom:

```ts
import { parseHTML } from "linkedom";
import { createGFMPipeline } from "markemental";

const { document } = parseHTML("<div></div>");
const target = document.querySelector("div")!;
const pipeline = createGFMPipeline(target, document, {});

await pipeline.push("# Hello\n\nWorld\n");
await pipeline.flush();
console.log(target.innerHTML);
```

Pick a pipeline by flavor:

| Factory | Flavor |
|---|---|
| `createGFMPipeline` | GFM |
| `createCommonMarkPipeline` | CommonMark |

The trailing partial block is held back until more input completes it or `flush()` runs. Tables commit once the delimiter row arrives and lists commit per item, so large blocks render progressively. Pushing after `flush()` throws. See the TSDoc on each factory for details.

## Custom renderers

Implement `MarkdownRenderer` to bring your own flavor or wrap a third-party parser, and compose it with any target through `createMarkdownPipeline`:

```ts
import { createMarkdownPipeline, createRenderTarget } from "markemental";

const pipeline = createMarkdownPipeline(
  new MyRenderer(createRenderTarget(document.getElementById("out")!), document),
);
```

The pipeline splits pushed chunks into lines and feeds them to the renderer one at a time; the renderer owns its target, document, and parse state. See the TSDoc on `createMarkdownPipeline` and `MarkdownRenderer` for details.

## MVP limitations

Single-line list items with basic indented nesting, single-paragraph quotes, and same-line code spans. No task lists, lazy list continuation, bare-URL autolinking, footnotes, or raw HTML passthrough yet.

## Development

```sh
npm install
npm run check   # typecheck + build + test
npm test        # vitest run
```

## License

MIT. See [LICENSE](LICENSE).
