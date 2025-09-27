"use client";

import { useSelectedENSNodeUrl } from "@/hooks/active/use-selected-ensnode-url";
import { ENSNodeProvider } from "@ensnode/ensnode-react";
import { PropsWithChildren } from "react";

/**
 * Provider component that configures ENSNodeProvider with the currently selected ENSNode connection URL.
 *
 * This component wraps the ENSNodeProvider from @ensnode/ensnode-react and automatically
 * configures it with the URL from the currently selected ENSNode connection URL. It serves as
 * a bridge between the connection management system and the ENSNode React hooks.
 *
 * @param children - React children to render within the provider context
 */
export function SelectedENSNodeProvider({ children }: PropsWithChildren) {
  const url = useSelectedENSNodeUrl();

  return <ENSNodeProvider config={{ client: { url } }}>{children}</ENSNodeProvider>;
}
