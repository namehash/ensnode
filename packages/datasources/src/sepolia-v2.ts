import { sepolia } from "viem/chains";

import { EnhancedAccessControl } from "./abis/ensv2/EnhancedAccessControl";
import { ETHRegistrar } from "./abis/ensv2/ETHRegistrar";
import { Registry } from "./abis/ensv2/Registry";
import { UniversalResolver as root_UniversalResolver } from "./abis/root/UniversalResolver";
import { ResolverABI } from "./lib/ResolverABI";
// Types
import { DatasourceNames, type ENSNamespace } from "./lib/types";
import SepoliaNamespace from "./sepolia";

/**
 * The Sepolia V2 ENSNamespace
 *
 * This represents the ENS V2 deployment on Sepolia, a separate namespace from the original Sepolia
 * ENS deployment, used for testing ENSv2.
 */
export default {
  // Extends the existing Sepolia Namespace
  ...SepoliaNamespace,

  [DatasourceNames.ENSRoot]: {
    chain: sepolia,
    contracts: {
      ...SepoliaNamespace[DatasourceNames.ENSRoot].contracts,

      // add the ENS V2 contracts
      RootRegistry: {
        abi: Registry,
        address: "0x245de1984f9bb890c5db0b1fb839470c6a4c7e08",
        startBlock: 9771022,
      },
      UniversalResolverV2: {
        abi: root_UniversalResolver,
        address: "0x50168842c0f5c9992a34085d9a6dc5b0a4f306ce",
        startBlock: 9771281,
      },
      ETHRegistry: {
        abi: Registry,
        address: "0x3f0920aa92c5f9bce54643c09955c5f241f1f763",
        startBlock: 9771260,
      },
      Registry: {
        abi: Registry,
        startBlock: 9770973,
      },
      EnhancedAccessControl: {
        abi: EnhancedAccessControl,
        startBlock: 9770973,
      },
    },
  },

  // add a namechain
  [DatasourceNames.Namechain]: {
    chain: sepolia,
    contracts: {
      Resolver: {
        abi: ResolverABI,
        startBlock: 3702721,
      },
      Registry: {
        abi: Registry,
        startBlock: 9770973,
      },
      EnhancedAccessControl: {
        abi: EnhancedAccessControl,
        startBlock: 9770973,
      },
      ETHRegistry: {
        abi: Registry,
        address: "0xf332544e6234f1ca149907d0d4658afd5feb6831",
        startBlock: 9770973,
      },
      ETHRegistrar: {
        abi: ETHRegistrar,
        address: "0xe37a1366c827d18dc0ad57f3767de4b3025ceac2",
        startBlock: 9843689,
      },
    },
  },
} satisfies ENSNamespace;
