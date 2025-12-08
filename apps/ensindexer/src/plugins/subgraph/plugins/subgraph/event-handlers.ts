import attach_SharedMultichainResolverHandlers from "@/plugins/subgraph/shared-handlers/multi-chain/Resolver";

import attach_NameWrapper from "./handlers/NameWrapper";
import attach_Registrar from "./handlers/Registrar";
import attach_Registry from "./handlers/Registry";

export default function () {
  attach_NameWrapper();
  attach_Registrar();
  attach_Registry();

  attach_SharedMultichainResolverHandlers();
}
