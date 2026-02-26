import { ErrorInfo } from "@/components/error-info";

export function ENSNodeConnectionError({ error }: { error: Error }) {
  return (
    <ErrorInfo
      title="Unable to connect to ENSNode"
      description={`Please check your connection settings and try again. Error: ${error.message}`}
    />
  );
}
