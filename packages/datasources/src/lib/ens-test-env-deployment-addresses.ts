import { Address, isAddress } from "viem";

interface ENSTestEnvDeploymentAddresses {
  LegacyENSRegistry: Address;
  ENSRegistry: Address;
  BaseRegistrarImplementation: Address;
  NameWrapper: Address;
  UniversalResolver: Address;

  // pre-UnwrappedEthRegistrarController naming for the EthRegistrarControllers
  // TODO: delete any time after ens-test-env is updated to support the new UnwrappedEthRegistrarController
  ETHRegistrarControllerOld: Address;
  ETHRegistrarController: Address;

  // post-UnwrappedEthRegistrarController naming for the EthRegistrarControllers
  LegacyETHRegistrarController: Address;
  WrappedETHRegistrarController: Address;
  UnwrappedETHRegistrarController: Address;
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
  } catch {
    return null;
  }
}
