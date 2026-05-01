import type { ResolutionsApi } from "@ensnode/ens-test-kit/interfaces";
import type { ChainId, Hex, NormalizedName, RecordsSelection, ResolvedRecords } from "@ensnode/ens-test-kit/types";

type ResolveRecordsResponse = {
  records: ResolvedRecords;
};

type ResolvePrimaryNameResponse = {
  name: string | null;
};

type ResolvePrimaryNamesResponse = {
  names: Record<string, string | null>;
};

export class RestAdapter implements ResolutionsApi {
  constructor(private readonly baseUrl: string) {}

  async resolveRecords(name: NormalizedName, selection: RecordsSelection): Promise<ResolvedRecords> {
    const query = new URLSearchParams();
    if (selection.name) query.set("name", "true");
    if (selection.addresses && selection.addresses.length > 0) {
      query.set("addresses", selection.addresses.join(","));
    }
    if (selection.texts && selection.texts.length > 0) {
      query.set("texts", selection.texts.join(","));
    }
    if (selection.contenthash) query.set("contenthash", "true");
    if (selection.pubkey) query.set("pubkey", "true");
    if (selection.abi) query.set("abi", "1");
    if (selection.interfaceIds && selection.interfaceIds.length > 0) {
      query.set("interfaces", selection.interfaceIds.join(","));
    }

    const encodedName = encodeURIComponent(name);
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    const body = await this.fetchJson<ResolveRecordsResponse>(
      `/api/resolve/records/${encodedName}${suffix}`,
    );

    return body.records;
  }

  async resolvePrimaryName(address: Hex, chainId: ChainId): Promise<string | null> {
    const body = await this.fetchJson<ResolvePrimaryNameResponse>(
      `/api/resolve/primary-name/${address}/${chainId}`,
    );
    return body.name;
  }

  async resolvePrimaryNames(
    address: Hex,
    chainIds?: ChainId[],
  ): Promise<Record<ChainId, string | null>> {
    const query =
      chainIds && chainIds.length > 0 ? `?chainIds=${encodeURIComponent(chainIds.join(","))}` : "";
    const body = await this.fetchJson<ResolvePrimaryNamesResponse>(
      `/api/resolve/primary-names/${address}${query}`,
    );

    const parsed: Record<ChainId, string | null> = {};
    for (const [rawChainId, name] of Object.entries(body.names)) {
      parsed[Number(rawChainId)] = name;
    }
    return parsed;
  }

  private async fetchJson<TBody>(path: string): Promise<TBody> {
    const response = await fetch(`${this.baseUrl}${path}`);
    const body = (await response.json()) as TBody;
    if (!response.ok) {
      throw new Error(`REST adapter request failed (${response.status}) for ${path}`);
    }
    return body;
  }
}
