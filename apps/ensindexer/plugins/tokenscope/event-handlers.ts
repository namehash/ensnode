import attach_BaseRegistrars from "./handlers/BaseRegistrars";
import attach_NameWrapper from "./handlers/NameWrapper";
import attach_Seaport from "./handlers/Seaport";
import attach_ThreeDNSToken from "./handlers/ThreeDNSToken";

export default function () {
  attach_BaseRegistrars();
  attach_NameWrapper();
  attach_ThreeDNSToken();
  attach_Seaport();
}
