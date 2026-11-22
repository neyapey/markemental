# markemental

> **Note:** This project is still under active development. APIs may change between releases.

Incremental modular markdown renderer. Push markdown in arbitrarily-sized chunks and complete blocks render to the target as they arrive, instead of waiting for the full document.

Four pipelines cover the frontend/backend × GFM/CommonMark matrix. Rendering targets a minimal `DOMNodeLike` interface, so the same code drives a live page in the browser and lightweight DOMs like linkedom on the server.

## Features

- Streaming input: `push()` chunks as they arrive, `flush()` the remainder.
- Blocks: headings, paragraphs, fenced code, bullet and ordered lists, blockquotes, thematic breaks.
- Inlines: emphasis, strong, inline code, links, images, autolinks, escapes, hard breaks.
- GFM extras: tables (with column alignment) and strikethrough; CommonMark pipelines degrade tables to paragraphs.
- Frontend pipelines batch DOM writes on `requestAnimationFrame` when given a scheduler.

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
import { createFrontendGFMPipeline } from "markemental";

const pipeline = createFrontendGFMPipeline(
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
import { createBackendGFMPipeline } from "markemental";

const { document } = parseHTML("<div></div>");
const target = document.querySelector("div")!;
const pipeline = createBackendGFMPipeline(target, document, {});

await pipeline.push("# Hello\n\nWorld\n");
await pipeline.flush();
console.log(target.innerHTML);
```

Pick a pipeline by environment and flavor:

| Factory | Environment | Flavor |
|---|---|---|
| `createFrontendGFMPipeline` | browser | GFM |
| `createFrontendCommonMarkPipeline` | browser | CommonMark |
| `createBackendGFMPipeline` | server | GFM |
| `createBackendCommonMarkPipeline` | server | CommonMark |

The trailing partial block is held back until more input completes it or `flush()` runs. Pushing after `flush()` throws. See the TSDoc on each factory for details.

## Custom renderers

Implement `MarkdownRenderer` to bring your own flavor or wrap a third-party parser, and compose it with any target through `createMarkdownPipeline`:

```ts
import { createMarkdownPipeline, DOMTarget } from "markemental";

const pipeline = createMarkdownPipeline(
  new MyRenderer(new DOMTarget(document.getElementById("out")!), document),
);
```

The pipeline splits pushed chunks into lines and feeds them to the renderer one at a time; the renderer owns its target, document, and parse state. See the TSDoc on `createMarkdownPipeline` and `MarkdownRenderer` for details.

## MVP limitations

Single-line list items, flat lists, single-paragraph quotes, and same-line code spans. No task lists, bare-URL autolinking, footnotes, or raw HTML passthrough yet.

## Development

```sh
npm install
npm run check   # typecheck + build + test
npm test        # vitest run
```

## License

MIT. See [LICENSE](LICENSE).
