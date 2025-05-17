import { Address, isAddress } from "viem";

interface ENSTestEnvDeploymentAddresses {
  LegacyENSRegistry: Address;
  ENSRegistry: Address;
  BaseRegistrarImplementation: Address;
  LegacyETHRegistrarController: Address;
  ETHRegistrarController: Address;
  NameWrapper: Address;
}

/**
 * Attempts to find/parse NEXT_PUBLIC_DEPLOYMENT_ADDRESSES or DEPLOYMENT_ADDRESSES from the env.
 * These environment variables are provided in the context of ens-test-env usage by both ensjs
 * and ens-app-v3.
 */
export function getENSTestEnvDeploymentAddresses(): ENSTestEnvDeploymentAddresses | null {
  try {
    const addresses = JSON.parse(
      process.env.NEXT_PUBLIC_DEPLOYMENT_ADDRESSES || process.env.DEPLOYMENT_ADDRESSES || "{}",
    ) as ENSTestEnvDeploymentAddresses;

    // ensure each value is an Address
    const onlyAddresses = Object.values(addresses).every((value) => isAddress(value));
    if (!onlyAddresses) return null;

    return addresses;
  } catch (error) {
    return null;
  }
}
