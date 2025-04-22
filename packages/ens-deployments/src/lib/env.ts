import { Address } from "viem";

interface DeploymentAddresses {
  LegacyENSRegistry: Address | undefined;
  ENSRegistry: Address | undefined;
  BaseRegistrarImplementation: Address | undefined;
  LegacyETHRegistrarController: Address | undefined;
  ETHRegistrarController: Address | undefined;
  NameWrapper: Address | undefined;
}

/**
 * Attempts to find/parse NEXT_PUBLIC_DEPLOYMENT_ADDRESSES or DEPLOYMENT_ADDRESSES from the env.
 * These environment variables are provided in the context of ens-test-env usage by both ensjs
 * and ens-app-v3.
 */
export function getDeploymentAddresses(): DeploymentAddresses | null {
  try {
    return JSON.parse(
      process.env.NEXT_PUBLIC_DEPLOYMENT_ADDRESSES || process.env.DEPLOYMENT_ADDRESSES || "{}",
    ) as DeploymentAddresses;
  } catch (error) {
    return null;
  }
}
