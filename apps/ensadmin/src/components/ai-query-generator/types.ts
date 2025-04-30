export interface AiQueryGeneratorResult {
  /** The query to execute */
  query: string;

  /** The variables to use for the query */
  variables: Record<string, unknown>;
}
