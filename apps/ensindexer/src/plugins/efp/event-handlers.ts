import attach_AccountMetadata from "./handlers/AccountMetadata";
import attach_ListRecords from "./handlers/ListRecords";
import attach_ListRegistry from "./handlers/ListRegistry";

export default function () {
  attach_ListRegistry();
  attach_ListRecords();
  attach_AccountMetadata();
}
