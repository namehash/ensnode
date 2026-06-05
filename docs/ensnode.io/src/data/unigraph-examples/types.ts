export interface CodeExample {
  codeSnippet: string;
  result: unknown;
  resultNote?: string;
}

export interface QueryExample {
  sql: CodeExample;
  sdk: CodeExample;
}
