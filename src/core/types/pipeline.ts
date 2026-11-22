export interface MarkdownPipeline {
  push(chunk: string | Promise<string>): Promise<void>
  flush(): Promise<void>
}
