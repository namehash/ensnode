import EnssdkPlayground from "../molecules/EnssdkPlayground";
import { getNiceHeightForSnippet } from "./common";
import { quickstartResolveDomainSnippet } from "./quickstartResolveDomainSnippet";

export default function EnssdkResolutionApiPlayground() {
  return (
    <EnssdkPlayground
      title="ENSNode SDK — Resolution API"
      description="Query ENS name data in seconds using [`@ensnode/ensnode-sdk`](/docs/integrate/integration-options/enssdk)."
      fileContent={quickstartResolveDomainSnippet}
      height={getNiceHeightForSnippet(quickstartResolveDomainSnippet)}
    />
  );
}
