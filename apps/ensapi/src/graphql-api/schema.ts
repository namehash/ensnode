import { builder } from "@/graphql-api/builder";

import "./schema/account-id";
import "./schema/domain";
import "./schema/permissions";
import "./schema/query";
import "./schema/registry";
import "./schema/scalars";

export const schema = builder.toSchema();
