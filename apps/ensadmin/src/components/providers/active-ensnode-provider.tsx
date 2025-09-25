"use client";

import { useActiveENSNodeUrl } from "@/hooks/active/use-active-ensnode-url";
import { ENSNodeProvider as _ENSNodeProvider } from "@ensnode/ensnode-react";
import { PropsWithChildren } from "react";

/**
 * Provider component that configures ENSNodeProvider with the currently active ENSNode connection URL.
 *
 * This component wraps the ENSNodeProvider from @ensnode/ensnode-react and automatically
 * configures it with the URL from the currently active ENSNode connection. It serves as
 * a bridge between the connection management system and the ENSNode React hooks.
 *
 * @param children - React children to render within the provider context
 */
export function ActiveENSNodeProvider({ children }: PropsWithChildren) {
  const url = useActiveENSNodeUrl();

  return <_ENSNodeProvider config={{ client: { url } }}>{children}</_ENSNodeProvider>;
}
