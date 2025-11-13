import { mergeAbis } from "@ponder/utils";

import { EarlyAccessRegistrarController } from "../basenames/EARegistrarController";
import { RegistrarController } from "../basenames/RegistrarController";
import { UpgradeableRegistrarController } from "../basenames/UpgradeableRegistrarController";
import { EthRegistrarController } from "../lineanames/EthRegistrarController";
import { LegacyEthRegistrarController } from "../root/LegacyEthRegistrarController";
import { UnwrappedEthRegistrarController } from "../root/UnwrappedEthRegistrarController";
import { WrappedEthRegistrarController } from "../root/WrappedEthRegistrarController";

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
