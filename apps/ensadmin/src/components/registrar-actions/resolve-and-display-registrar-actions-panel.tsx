import { useActiveNamespace } from "@/hooks/active/use-active-namespace";

import { DisplayRegistrarActionsPanel } from "./display-registrar-actions-panel";
import { useFetchRegistrarActions } from "./use-fetch-registrar-actions";

interface ResolveAndDisplayRegistrarActionsPanelProps {
  maxItems: number;

  title: string;
}

/**
 * Resolves Registrar Actions through ENSNode and displays the Registrar Actions Panel.
 */
export function ResolveAndDisplayRegistrarActionsPanel({
  maxItems,
  title,
}: ResolveAndDisplayRegistrarActionsPanelProps) {
  const namespaceId = useActiveNamespace();
  const resolvedRegistrarActions = useFetchRegistrarActions({
    maxItems,
  });

  return (
    <DisplayRegistrarActionsPanel
      namespaceId={namespaceId}
      title={title}
      resolvedRegistrarActions={resolvedRegistrarActions}
    />
  );
}
