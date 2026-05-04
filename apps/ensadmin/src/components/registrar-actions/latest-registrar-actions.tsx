import { useRegistrarActions } from "@ensnode/ensnode-react";
import { RegistrarActionsOrders, RegistrarActionsResponseCodes } from "@ensnode/ensnode-sdk";

import { ErrorInfo } from "@/components/error-info";
import { useActiveEnsNodeStackInfo } from "@/hooks/active/use-active-ensnode-stack-info";

import {
  DisplayRegistrarActionsList,
  DisplayRegistrarActionsListPlaceholder,
} from "./display-registrar-actions";

const TITLE = "Latest indexed registrar actions";

interface LatestRegistrarActionsProps {
  recordsPerPage: number;
}

/**
 * Fetches the latest Registrar Actions and displays them.
 */
export function LatestRegistrarActions({ recordsPerPage }: LatestRegistrarActionsProps) {
  const { namespace } = useActiveEnsNodeStackInfo().ensIndexer;
  const query = useRegistrarActions({
    order: RegistrarActionsOrders.LatestRegistrarActions,
    recordsPerPage,
  });

  if (query.isPending) {
    return <DisplayRegistrarActionsListPlaceholder title={TITLE} recordsPerPage={recordsPerPage} />;
  }

  if (query.isError) {
    return <ErrorInfo title={TITLE} description={query.error.message} />;
  }

  if (query.data.responseCode === RegistrarActionsResponseCodes.Error) {
    return <ErrorInfo title={TITLE} description={query.data.error.message} />;
  }

  return (
    <DisplayRegistrarActionsList
      title={TITLE}
      namespaceId={namespace}
      registrarActions={query.data.registrarActions}
    />
  );
}
