import { defineCommand } from "citty";
import { stringifyAccountId, toNormalizedAddress } from "enssdk";

import {
  type DatasourceIdentifyQuery,
  identifyDatasourceContracts,
  maybeGetDatasource,
} from "@ensnode/datasources";

import { namespaceArgs, outputArgs } from "../../lib/args";
import { resolveNamespace } from "../../lib/config";
import { printResult, runSafely } from "../../lib/output";
import { assertCleanIdentifier } from "../../lib/validate";

/**
 * Parses a `[chainId:]address` / `eip155:chainId:address` input into a {@link DatasourceIdentifyQuery}.
 * The address is validated and normalized via {@link toNormalizedAddress}, which throws on non-addresses.
 */
function parseIdentifyQuery(input: string): DatasourceIdentifyQuery {
  assertCleanIdentifier(input, "address");

  const parts = input.split(":");
  let chainIdPart: string | undefined;
  let addressPart: string;

  if (parts.length === 1) {
    [addressPart] = parts;
  } else if (parts.length === 2) {
    [chainIdPart, addressPart] = parts;
  } else if (parts.length === 3) {
    const [caipNamespace, reference, address] = parts;
    if (caipNamespace !== "eip155") {
      throw new Error(
        `Unsupported CAIP-10 namespace "${caipNamespace}". Only "eip155" is supported.`,
      );
    }
    chainIdPart = reference;
    addressPart = address;
  } else {
    throw new Error(
      `Invalid address "${input}". Expected [chainId:]address or eip155:chainId:address.`,
    );
  }

  const address = toNormalizedAddress(addressPart);
  if (chainIdPart === undefined) return { address };

  if (!/^\d+$/.test(chainIdPart)) {
    throw new Error(`Invalid chainId "${chainIdPart}". Expected a positive integer.`);
  }
  const chainId = Number(chainIdPart);
  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw new Error(`Invalid chainId "${chainIdPart}". Expected a positive integer.`);
  }
  return { chainId, address };
}

export const identify = defineCommand({
  meta: {
    name: "identify",
    description: "Identify a well-known ENS contract by address (accepts [chainId:]address)",
  },
  args: {
    address: {
      type: "positional",
      required: true,
      description: "An address, optionally chain-scoped: 0x… , 1:0x… , or eip155:1:0x…",
    },
    ...namespaceArgs,
    ...outputArgs,
  },
  run: ({ args }) =>
    runSafely(() => {
      const namespace = resolveNamespace(args);
      const query = parseIdentifyQuery(args.address);

      const matches = identifyDatasourceContracts(namespace, query).map((match) => ({
        ...match,
        chain: maybeGetDatasource(match.namespace, match.datasource)?.chain.name ?? null,
        accountId: stringifyAccountId({ chainId: match.chainId, address: match.address }),
      }));

      const result = {
        query: { namespace, chainId: query.chainId ?? null, address: query.address },
        matches,
      };

      printResult(result, args, (data: typeof result) =>
        data.matches.length === 0
          ? "No known contract found."
          : data.matches
              .map(
                (m) =>
                  `${m.namespace} · ${m.datasource} · ${m.contract} — ${m.accountId} (${m.chain})`,
              )
              .join("\n"),
      );
    }),
});
