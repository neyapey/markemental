/**
 * Incremental markdown rendering pipeline.
 *
 * @remarks
 * A pipeline accepts markdown in arbitrarily-sized chunks and renders complete
 * blocks to its target as they arrive. A trailing partial block is held back
 * until more input completes it or {@link MarkdownPipeline.flush} is called.
 *
 * @public
 */
export interface MarkdownPipeline {
  /**
   * Push a chunk of markdown into the pipeline.
   *
   * @param chunk - Markdown text, or a promise resolving to markdown text.
   * @returns A promise that resolves once the chunk has been consumed and any
   * complete blocks have been rendered to the target.
   */
  push(chunk: string | Promise<string>): Promise<void>
  /**
   * Render any buffered remainder and release pipeline resources.
   *
   * @returns A promise that resolves once all output has been flushed.
   */
  flush(): Promise<void>
}
