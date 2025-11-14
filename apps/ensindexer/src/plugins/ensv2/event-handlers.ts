import attach_ENSv1RegistryHandlers from "./handlers/ENSv1Registry";
import attach_EnhancedAccessControlHandlers from "./handlers/EnhancedAccessControl";
import attach_NameWrapperHandlers from "./handlers/NameWrapper";
import attach_RegistrarHandlers from "./handlers/Registrar";
import attach_RegistrarControllerHandlers from "./handlers/RegistrarController";
import attach_RegistryHandlers from "./handlers/Registry";

export default function () {
  attach_ENSv1RegistryHandlers();
  attach_EnhancedAccessControlHandlers();
  attach_NameWrapperHandlers();
  attach_RegistrarHandlers();
  attach_RegistrarControllerHandlers();
  attach_RegistryHandlers();
}
