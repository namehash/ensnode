import attach_RegistryHandlers from "./handlers/Registry";
import attach_ResolverHandlers from "./handlers/Resolver";
import attach_StandaloneReverseRegistrarHandlers from "./handlers/StandaloneReverseRegistrar";
import attach_ThreeDNSTokenHandlers from "./handlers/ThreeDNSToken";

export default function () {
  attach_RegistryHandlers();
  attach_ResolverHandlers();
  attach_StandaloneReverseRegistrarHandlers();
  attach_ThreeDNSTokenHandlers();
}
