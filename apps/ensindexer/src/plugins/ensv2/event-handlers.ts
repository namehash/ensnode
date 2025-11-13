import attach_ENSv1RegistryHandlers from "./handlers/ENSv1Registry";
import attach_EnhancedAccessControlHandlers from "./handlers/EnhancedAccessControl";
import attach_NameWrapperHandlers from "./handlers/NameWrapper";
import attach_RegistrarHandlers from "./handlers/Registrar";
import attach_RegistryHandlers from "./handlers/Registry";

export default function () {
  attach_RegistrarHandlers();
  attach_EnhancedAccessControlHandlers();
  attach_ENSv1RegistryHandlers();
  attach_NameWrapperHandlers();
  attach_RegistryHandlers();
}
