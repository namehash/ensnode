import attach_ENSv1RegistryHandlers from "./handlers/ENSv1Registry";
import attach_ENSv2RegistryHandlers from "./handlers/ENSv2Registry";
import attach_ResolverHandlers from "./handlers/Resolver";
import attach_StandaloneReverseRegistrarHandlers from "./handlers/StandaloneReverseRegistrar";
import attach_ThreeDNSTokenHandlers from "./handlers/ThreeDNSToken";
import attach_UpgradableProxyResolverHandlers from "./handlers/UpgradableProxyResolver";

export default function () {
  attach_ENSv1RegistryHandlers();
  attach_ENSv2RegistryHandlers();
  attach_ResolverHandlers();
  attach_StandaloneReverseRegistrarHandlers();
  attach_UpgradableProxyResolverHandlers();
  attach_ThreeDNSTokenHandlers();
}
