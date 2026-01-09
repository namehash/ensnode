import { mergeAbis } from "@ponder/utils";

import { EarlyAccessRegistrarController } from "../abis/basenames/EARegistrarController";
import { RegistrarController } from "../abis/basenames/RegistrarController";
import { UpgradeableRegistrarController } from "../abis/basenames/UpgradeableRegistrarController";
import { EthRegistrarController } from "../abis/lineanames/EthRegistrarController";
import { LegacyEthRegistrarController } from "../abis/root/LegacyEthRegistrarController";
import { UnwrappedEthRegistrarController } from "../abis/root/UnwrappedEthRegistrarController";
import { WrappedEthRegistrarController } from "../abis/root/WrappedEthRegistrarController";

export const AnyRegistrarControllerABI = mergeAbis([
  // ethnames
  LegacyEthRegistrarController,
  WrappedEthRegistrarController,
  UnwrappedEthRegistrarController,
  // basenames
  EarlyAccessRegistrarController,
  RegistrarController,
  UpgradeableRegistrarController,
  // lineanames
  EthRegistrarController,
]);
