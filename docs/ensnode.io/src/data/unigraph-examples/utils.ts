export const EnsNodeInstances = {
  V2Sepolia: "V2 Sepolia",
  Alpha: "Alpha",
  AlphaSepolia: "Alpha Sepolia",
  Mainnet: "Mainnet",
  Sepolia: "Sepolia",
} as const;

export type EnsNodeInstance = (typeof EnsNodeInstances)[keyof typeof EnsNodeInstances];

export const outputSource = (ensNodeInstance: EnsNodeInstance) =>
  `Output matches a point in time snapshot of ENSDb result from our <a href="${ensNodeInstanceDocUrl(ensNodeInstance)}">${ensNodeInstance} Hosted ENSNode instance</a>. Live output depends on the configuration of your ENSNode instance and also changes that may have happened in ENS since this point in time snapshot example response was captured.`;

const ensNodeInstanceDocUrl = (instance: EnsNodeInstance) => {
  const hostedInstancesPath = "/docs/hosted-instances#ensnode-";

  switch (instance) {
    case EnsNodeInstances.V2Sepolia:
      return `${hostedInstancesPath}v2-sepolia`;
    case EnsNodeInstances.Alpha:
      return `${hostedInstancesPath}alpha`;
    case EnsNodeInstances.AlphaSepolia:
      return `${hostedInstancesPath}alpha-sepolia`;
    case EnsNodeInstances.Mainnet:
      return `${hostedInstancesPath}mainnet`;
    case EnsNodeInstances.Sepolia:
      return `${hostedInstancesPath}sepolia`;
  }
};
