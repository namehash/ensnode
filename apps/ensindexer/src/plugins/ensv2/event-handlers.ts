import attach_ENSv1RegistryHandlers from "./handlers/ENSv1Registry";
import attach_EnhancedAccessControlHandlers from "./handlers/EnhancedAccessControl";
import attach_RegistryHandlers from "./handlers/Registry";

export default function () {
  attach_RegistryHandlers();
  attach_EnhancedAccessControlHandlers();
  attach_ENSv1RegistryHandlers();
}
