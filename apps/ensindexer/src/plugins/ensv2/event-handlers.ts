import attach_EnhancedAccessControlHandlers from "./handlers/EnhancedAccessControl";
import attach_RegistryHandlers from "./handlers/Registry";

export default function () {
  attach_RegistryHandlers();
  attach_EnhancedAccessControlHandlers();
}
