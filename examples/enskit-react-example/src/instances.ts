export interface EnsnodeInstanceConstants {
  defaultAddress: string;
  defaultSearchLabel: string;
  defaultDomainName: string;
}

export interface EnsnodeInstance {
  id: string;
  url: string;
  label: string;
  constants: EnsnodeInstanceConstants;
}

export const ENSNODE_INSTANCES: EnsnodeInstance[] = [
  {
    id: "alpha",
    url: "https://api.alpha.ensnode.io",
    label: "Alpha Mainnet",
    constants: {
      defaultAddress: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
      defaultSearchLabel: "vitalik",
      defaultDomainName: "ens.eth",
    },
  },
  {
    id: "v2-sepolia",
    url: "https://api.v2-sepolia.ensnode.io",
    label: "V2 Sepolia",
    constants: {
      defaultAddress: "0x801d2e48d378f161dba7ad7ad002ad557714c191",
      defaultSearchLabel: "vitalik",
      defaultDomainName: "eth",
    },
  },
];

export const DEFAULT_ENSNODE_INSTANCE = ENSNODE_INSTANCES[0];

export const ENSNODE_INSTANCE_STORAGE_KEY = "enskit-react-example:instance-id";

export function getEnsnodeInstanceById(id: string): EnsnodeInstance | undefined {
  return ENSNODE_INSTANCES.find((instance) => instance.id === id);
}
