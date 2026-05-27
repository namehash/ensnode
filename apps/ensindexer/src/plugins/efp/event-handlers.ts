import attach_AccountMetadata from "./handlers/AccountMetadata";
import attach_ListRecords from "./handlers/ListRecords";
import attach_ListRegistry from "./handlers/ListRegistry";
import attach_Resolver from "./handlers/Resolver";

export default function () {
  attach_ListRegistry();
  attach_ListRecords();
  attach_AccountMetadata();
  attach_Resolver();
}
