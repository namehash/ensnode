import { type Context, type Event, EventNames, ponder } from "ponder:registry";
import { domains, registrations } from "ponder:schema";
import type { Hex } from "viem";
import {
  NAMEHASH_BASE_ETH,
  isLabelValid,
  makeSubnodeNamehash,
  tokenIdToLabel,
} from "../../../lib/ens-helpers";
import { upsertAccount, upsertRegistration } from "../../../lib/upserts";
import { PonderEnsIndexingHandlerModule } from "../../types";
import { type NsType, ns } from "../ponder.config";

// all nodes referenced by EthRegistrar are parented to .eth
const ROOT_NODE = NAMEHASH_BASE_ETH;
const GRACE_PERIOD_SECONDS = 7776000n; // 90 days in seconds

async function handleNameRegistered({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"BaseRegistrar:NameRegistered">>;
}) {
  const { id, owner, expires } = event.args;

  await upsertAccount(context, owner);

  const label = tokenIdToLabel(id);
  const node = makeSubnodeNamehash(ROOT_NODE, label);

  // TODO: materialze labelName via rainbow tables ala Registry.ts
  const labelName = undefined;

  await upsertRegistration(context, {
    id: label,
    domainId: node,
    registrationDate: event.block.timestamp,
    expiryDate: expires,
    registrantId: owner,
    labelName,
  });

  console.log('handleNameRegistered', { event: {
    block: event.block.number,
    tx: event.transaction.hash,
    logIndex: event.log.logIndex,
  }, id, owner, expires, label, node, labelName });

  await context.db.update(domains, { id: node }).set({
    registrantId: owner,
    expiryDate: expires + GRACE_PERIOD_SECONDS,
    labelName,
  });

  // TODO: log Event
}

async function handleNameRegisteredByController({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"RegistrarController:NameRegistered">>;
}) {
  return await setNamePreimage(
    context,
    event.args.name,
    event.args.label,
    null
  );
}

async function handleNameRenewedByController({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"RegistrarController:NameRenewed">>;
}) {
  return await setNamePreimage(
    context,
    event.args.name,
    event.args.label,
    null
  );
}

async function setNamePreimage(
  context: Context,
  name: string,
  label: Hex,
  cost: bigint | null
) {
  if (!isLabelValid(name)) return;

  const node = makeSubnodeNamehash(ROOT_NODE, label);
  const domain = await context.db.find(domains, { id: node });
  if (!domain) throw new Error("domain expected");

  if (domain.labelName !== name) {
    await context.db
      .update(domains, { id: node })
      .set({ labelName: name, name: `${name}.eth` });
  }

  await context.db
    .update(registrations, { id: label })
    .set({ labelName: name, cost });
}

async function handleNameRenewed({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"BaseRegistrar:NameRenewed">>;
}) {
  const { id, expires } = event.args;

  const label = tokenIdToLabel(id);
  const node = makeSubnodeNamehash(ROOT_NODE, label);

  await context.db
    .update(registrations, { id: label })
    .set({ expiryDate: expires });

  await context.db
    .update(domains, { id: node })
    .set({ expiryDate: expires + GRACE_PERIOD_SECONDS });

  // TODO: log Event
}

async function handleNameTransferred({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"BaseRegistrar:Transfer">>;
}) {
  const { id: tokenId, from, to } = event.args;

  await upsertAccount(context, to);

  const label = tokenIdToLabel(tokenId);
  const node = makeSubnodeNamehash(ROOT_NODE, label);

  const registration = await context.db.find(registrations, { id: label });
  if (!registration) return;

  await context.db
    .update(registrations, { id: label })
    .set({ registrantId: to });

  await context.db.update(domains, { id: node }).set({ registrantId: to });

  // TODO: log Event
}

function initBaseRegistrarHandlers() {
  ponder.on(ns("BaseRegistrar:NameRegistered"), handleNameRegistered);
  ponder.on(ns("BaseRegistrar:NameRenewed"), handleNameRenewed);
  ponder.on(ns("BaseRegistrar:Transfer"), handleNameTransferred);

  ponder.on(
    ns("RegistrarController:NameRegistered"),
    handleNameRegisteredByController
  );
  ponder.on(
    ns("RegistrarController:NameRenewed"),
    handleNameRenewedByController
  );

  ponder.on(
    ns("EARegistrarController:NameRegistered"),
    handleNameRegisteredByController
  );
}

export const handlerModule: Readonly<PonderEnsIndexingHandlerModule> = {
  attachHandlers: initBaseRegistrarHandlers,
};
