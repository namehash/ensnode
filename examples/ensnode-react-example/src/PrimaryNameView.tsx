import {
  DEFAULT_EVM_CHAIN_ID,
  type DefaultableChainId,
  type NormalizedAddress,
  toNormalizedAddress,
} from "enssdk";
import { useId, useMemo, useState } from "react";

import {
  DatasourceNames,
  type ENSNamespaceId,
  getENSRootChain,
  maybeGetDatasource,
} from "@ensnode/datasources";
import { usePrimaryName } from "@ensnode/ensnode-react";

import { EXPECTED_NAMESPACE } from "./config";

const DEFAULT_INPUT = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // vitalik.eth
const DEFAULT_ADDRESS: NormalizedAddress = toNormalizedAddress(DEFAULT_INPUT);

const REVERSE_RESOLVER_DATASOURCES = [
  DatasourceNames.ReverseResolverBase,
  DatasourceNames.ReverseResolverLinea,
  DatasourceNames.ReverseResolverOptimism,
  DatasourceNames.ReverseResolverArbitrum,
  DatasourceNames.ReverseResolverScroll,
] as const;

interface ChainOption {
  id: DefaultableChainId;
  label: string;
}

/**
 * Builds the ENSIP-19 chain options for the picker:
 * default EVM chain (0), the ENS root chain, then any reverse-resolver chains
 * exposed by the active namespace. Matches the composition in
 * `apps/ensadmin/src/app/inspect/primary-name/page.tsx`.
 */
function getENSIP19ChainOptions(namespace: ENSNamespaceId): ChainOption[] {
  const root = getENSRootChain(namespace);
  const options: ChainOption[] = [
    { id: DEFAULT_EVM_CHAIN_ID, label: "Default EVM Chain Address (ENSIP-19)" },
    { id: root.id, label: `${root.name} — ENS Root` },
  ];

  const seen = new Set<number>([DEFAULT_EVM_CHAIN_ID, root.id]);
  for (const name of REVERSE_RESOLVER_DATASOURCES) {
    const ds = maybeGetDatasource(namespace, name);
    if (!ds || seen.has(ds.chain.id)) continue;
    seen.add(ds.chain.id);
    options.push({ id: ds.chain.id, label: ds.chain.name });
  }

  return options;
}

export function PrimaryNameView() {
  const addressInputId = useId();
  const chainSelectId = useId();

  const chainOptions = useMemo(() => getENSIP19ChainOptions(EXPECTED_NAMESPACE), []);

  const [address, setAddress] = useState<NormalizedAddress>(DEFAULT_ADDRESS);
  const [chainId, setChainId] = useState<DefaultableChainId>(
    getENSRootChain(EXPECTED_NAMESPACE).id,
  );
  const [input, setInput] = useState<string>(DEFAULT_INPUT);
  const [inputError, setInputError] = useState<string | null>(null);

  const { data, isLoading, error } = usePrimaryName({
    address,
    chainId,
    accelerate: true,
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setAddress(toNormalizedAddress(input.trim()));
      setInputError(null);
    } catch (err) {
      setInputError(err instanceof Error ? err.message : "Invalid EVM address.");
    }
  };

  return (
    <section>
      <h2>Primary Name</h2>
      <p>
        Resolves the ENSIP-19 Primary Name for an address on a selected chain using{" "}
        <code>usePrimaryName</code>. Because ENSIP-19 is multichain, pick which chain's primary name
        you want to read.
      </p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor={addressInputId}>EVM Address</label>
          <input
            id={addressInputId}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="0x…"
            aria-invalid={inputError !== null}
            aria-describedby={inputError ? `${addressInputId}-error` : undefined}
            style={{ width: "28rem" }}
          />
        </div>

        <div>
          <label htmlFor={chainSelectId}>ENSIP-19 Chain</label>
          <select
            id={chainSelectId}
            value={chainId}
            onChange={(event) => setChainId(Number(event.target.value) as DefaultableChainId)}
          >
            {chainOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.id} ({option.label})
              </option>
            ))}
          </select>
        </div>

        <button type="submit">Resolve</button>

        {inputError && (
          <p id={`${addressInputId}-error`} role="alert">
            {inputError}
          </p>
        )}
      </form>

      {isLoading && <p>Loading…</p>}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <p>
          Primary Name: <strong>{data.name ?? "(none)"}</strong>
        </p>
      )}
    </section>
  );
}
