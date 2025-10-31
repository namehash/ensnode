import attach_ThreeDNSResolver from "./handlers/ThreeDNSResolver";
import attach_ThreeDNSToken from "./handlers/ThreeDNSToken";

export default function () {
  attach_ThreeDNSResolver();
  attach_ThreeDNSToken();
}
