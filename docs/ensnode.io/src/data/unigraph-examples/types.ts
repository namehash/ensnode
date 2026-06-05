export interface CodeExample {
  codeSnippet: string;
  result: unknown;
}

export interface QueryExample {
  sql: CodeExample;
  sdk: CodeExample;
}
