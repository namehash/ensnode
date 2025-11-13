import type { Context } from "ponder:registry";
import schema from "ponder:schema";

import { type DomainId, makeRegistrationId } from "@ensnode/ensnode-sdk";

/**
 * TODO: find the most recent registration, active or otherwise
 */
export async function getLatestRegistration(context: Context, domainId: DomainId) {
  const registrationId = makeRegistrationId(domainId, 0);
  return await context.db.find(schema.registration, { id: registrationId });
}
