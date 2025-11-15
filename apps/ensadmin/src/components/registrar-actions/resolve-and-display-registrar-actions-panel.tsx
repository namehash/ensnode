import { useActiveNamespace } from "@/hooks/active/use-active-namespace";

import { DisplayRegistrarActionsPanel } from "./display-registrar-actions-panel";
import { useStatefulRegistrarActions } from "./use-fetch-registrar-actions";

interface FetchAndDisplayRegistrarActionsPanelProps {
  itemsPerPage: number;

  title: string;
}

/**
 * Fetches Registrar Actions through ENSNode and displays the Registrar Actions Panel.
 */
export function FetchAndDisplayRegistrarActionsPanel({
  itemsPerPage,
  title,
}: FetchAndDisplayRegistrarActionsPanelProps) {
  const namespaceId = useActiveNamespace();
  const registrarActions = useStatefulRegistrarActions({
    itemsPerPage,
  });

  return (
    <DisplayRegistrarActionsPanel
      namespaceId={namespaceId}
      title={title}
      registrarActions={registrarActions}
    />
  );
}
