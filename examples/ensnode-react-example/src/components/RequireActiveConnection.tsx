import type { ReactNode } from "react";

import { useIndexingStatus } from "@ensnode/ensnode-react";
import { EnsApiIndexingStatusResponseCodes } from "@ensnode/ensnode-sdk";

import { ENSNODE_URL, EXPECTED_NAMESPACE } from "../config";
import { classifyConnectionError } from "../lib/classify-connection-error";

interface RequireActiveConnectionProps {
  children: ReactNode;
}

/**
 * Protects child rendering on a healthy, namespace-matching ENSNode connection.
 *
 * Modeled after ENSAdmin's `RequireActiveConnection`
 * (`apps/ensadmin/src/components/connections/require-active-connection.tsx`),
 * with the additional namespace-mismatch check required by this example app.
 *
 * Failure modes are intentionally disambiguated so the UI can tell apart a
 * network-level problem from an application-level problem:
 *
 * 1. `useIndexingStatus` throws (fetch failed, server returned an error response,
 *    or the response failed deserialization) `classifyConnectionError` decides
 *    whether to call this a `network` or `application` failure.
 * 2. The server answered with `responseCode === "error"` surfaced as an
 *    application-level "ENSNode reported its indexing status is unavailable" state.
 * 3. The response is OK but `stackInfo.ensIndexer.namespace` does not match
 *    `EXPECTED_NAMESPACE` surfaced as an `unsupported-namespace` mismatch and
 *    the connection is refused.
 *
 * Only once we've confirmed (1) we can reach ENSNode, (2) it returned a usable
 * config, and (3) the namespace matches, do we render `children`.
 */
export function RequireActiveConnection({ children }: RequireActiveConnectionProps) {
  const { data, isLoading, error } = useIndexingStatus();

  if (isLoading) {
    return (
      <section>
        <p>Connecting to ENSNode at {ENSNODE_URL.href}…</p>
      </section>
    );
  }

  if (error) {
    const failure = classifyConnectionError(error);
    return (
      <section>
        <h2>Connection failed ({failure.kind})</h2>
        <p>{failure.message}</p>
        <p>
          Configured ENSNode: <code>{ENSNODE_URL.href}</code>
        </p>
      </section>
    );
  }

  if (!data || data.responseCode === EnsApiIndexingStatusResponseCodes.Error) {
    return (
      <section>
        <h2>Connection failed (application)</h2>
        <p>
          ENSNode answered, but reported that its indexing status is currently unavailable. The
          instance may still be starting up or its dependencies (ENSDb, ENSIndexer) are not yet
          healthy.
        </p>
      </section>
    );
  }

  const actualNamespace = data.stackInfo.ensIndexer.namespace;
  if (actualNamespace !== EXPECTED_NAMESPACE) {
    return (
      <section>
        <h2>Connection refused (unsupported-namespace)</h2>
        <p>
          This example app was built for ENS namespace <code>{EXPECTED_NAMESPACE}</code>, but the
          ENSNode at <code>{ENSNODE_URL.href}</code> is indexing namespace{" "}
          <code>{actualNamespace}</code>.
        </p>
        <p>
          Re-run with <code>VITE_ENS_NAMESPACE={actualNamespace}</code> or point{" "}
          <code>VITE_ENSNODE_URL</code> at an instance indexing <code>{EXPECTED_NAMESPACE}</code>.
        </p>
      </section>
    );
  }

  return <>{children}</>;
}
