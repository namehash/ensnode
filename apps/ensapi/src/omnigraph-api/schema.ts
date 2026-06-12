import { builder } from "@/omnigraph-api/builder";

import "./schema/account-efp";
import "./schema/account-id";
import "./schema/reverse-resolve";
import "./schema/connection";
import "./schema/domain";
import "./schema/domain-canonical";
import "./schema/domain-inputs";
import "./schema/efp-account-metadata";
import "./schema/efp-list";
import "./schema/efp-list-record";
import "./schema/query-efp";
import "./schema/event";
import "./schema/label";
import "./schema/name-or-node";
import "./schema/order-direction";
import "./schema/permissions";
import "./schema/query";
import "./schema/registry";
import "./schema/renewal";
import "./schema/resolution";
import "./schema/resolver-records";
import "./schema/scalars";

export const schema = builder.toSchema();
