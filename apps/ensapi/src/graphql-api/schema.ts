import { builder } from "@/graphql-api/builder";

import "./schema/account-id";
import "./schema/account-registries-permissions";
import "./schema/account-resolver-permissions";
import "./schema/connection";
import "./schema/domain";
import "./schema/event";
import "./schema/label";
import "./schema/name-or-node";
import "./schema/order-direction";
import "./schema/permissions";
import "./schema/query";
import "./schema/registry";
import "./schema/renewal";
import "./schema/resolver-records";
import "./schema/scalars";

export const schema = builder.toSchema();
