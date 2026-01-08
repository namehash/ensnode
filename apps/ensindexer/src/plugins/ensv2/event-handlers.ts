import attach_BaseRegistrarHandlers from "./handlers/ensv1/BaseRegistrar";
import attach_ENSv1RegistryHandlers from "./handlers/ensv1/ENSv1Registry";
import attach_NameWrapperHandlers from "./handlers/ensv1/NameWrapper";
import attach_RegistrarControllerHandlers from "./handlers/ensv1/RegistrarController";
import attach_RegistryHandlers from "./handlers/ensv2/ENSv2Registry";
import attach_EnhancedAccessControlHandlers from "./handlers/ensv2/EnhancedAccessControl";
import attach_ETHRegistrarHandlers from "./handlers/ensv2/ETHRegistrar";

export default function () {
  attach_BaseRegistrarHandlers();
  attach_ENSv1RegistryHandlers();
  attach_NameWrapperHandlers();
  attach_RegistrarControllerHandlers();
  attach_EnhancedAccessControlHandlers();
  attach_RegistryHandlers();
  attach_ETHRegistrarHandlers();
}
