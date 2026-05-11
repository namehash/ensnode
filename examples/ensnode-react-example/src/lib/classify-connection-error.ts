export type ConnectionFailureKind =
  | "network"
  | "application"
  | "unsupported-namespace";

export interface ConnectionFailure {
  kind: ConnectionFailureKind;
  message: string;
}

// TODO: abstract out
export function classifyConnectionError(error: unknown): ConnectionFailure {
  if (error instanceof TypeError) {
    return {
      kind: "network",
      message:
        "Could not reach the ENSNode instance. " +
        "Check the URL, your network, and that the server allows CORS from this origin.",
    };
  }

  if (error instanceof Error) {
    return { kind: "application", message: error.message };
  }

  return {
    kind: "application",
    message: "Unknown error connecting to ENSNode.",
  };
}
