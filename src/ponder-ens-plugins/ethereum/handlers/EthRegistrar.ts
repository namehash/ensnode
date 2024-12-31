import { type Context, type Event, ponder } from "ponder:registry";
import { domains, registrations } from "ponder:schema";
import type { Hex } from "viem";
import {
  NAMEHASH_ETH,
  isLabelValid,
  makeSubnodeNamehash,
  tokenIdToLabel,
} from "../../../lib/ens-helpers";
import { upsertAccount, upsertRegistration } from "../../../lib/upserts";
import { PonderEnsIndexingHandlerModule } from "../../types";

// all nodes referenced by EthRegistrar are parented to .eth
const ROOT_NODE = NAMEHASH_ETH;
const GRACE_PERIOD_SECONDS = 7776000n; // 90 days in seconds

async function handleNameRegistered({
  context,
  event,
}: {
  context: Context;
  event: Event<"BaseRegistrar:NameRegistered">;
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

  await context.db.update(domains, { id: node }).set({
    registrantId: owner,
    expiryDate: expires + GRACE_PERIOD_SECONDS,
    labelName,
  });

  // TODO: log Event
}

async function handleNameRegisteredByControllerOld({
  context,
  event,
}: {
  context: Context;
  event: Event<"EthRegistrarControllerOld:NameRegistered">;
}) {
  return await setNamePreimage(
    context,
    event.args.name,
    event.args.label,
    event.args.cost
  );
}

async function handleNameRegisteredByController({
  context,
  event,
}: {
  context: Context;
  event: Event<"EthRegistrarController:NameRegistered">;
}) {
  return await setNamePreimage(
    context,
    event.args.name,
    event.args.label,
    event.args.baseCost + event.args.premium
  );
}

async function handleNameRenewedByController({
  context,
  event,
}: {
  context: Context;
  event:
    | Event<"EthRegistrarController:NameRenewed">
    | Event<"EthRegistrarControllerOld:NameRenewed">;
}) {
  return await setNamePreimage(
    context,
    event.args.name,
    event.args.label,
    event.args.cost
  );
}

async function setNamePreimage(
  context: Context,
  name: string,
  label: Hex,
  cost: bigint
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
  event: Event<"BaseRegistrar:NameRenewed">;
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
  event: Event<"BaseRegistrar:Transfer">;
}) {
  const { tokenId, from, to } = event.args;

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

function initEthRegistrarHandlers() {
  console.log("Indexing Ethereum ENS");
  ponder.on("BaseRegistrar:NameRegistered", handleNameRegistered);
  ponder.on("BaseRegistrar:NameRenewed", handleNameRenewed);
  ponder.on("BaseRegistrar:Transfer", handleNameTransferred);

  ponder.on(
    "EthRegistrarControllerOld:NameRegistered",
    handleNameRegisteredByControllerOld
  );
  ponder.on(
    "EthRegistrarControllerOld:NameRenewed",
    handleNameRenewedByController
  );

  ponder.on(
    "EthRegistrarController:NameRegistered",
    handleNameRegisteredByController
  );
  ponder.on(
    "EthRegistrarController:NameRenewed",
    handleNameRenewedByController
  );
}

export const handlerModule: Readonly<PonderEnsIndexingHandlerModule> = {
  attachHandlers: initEthRegistrarHandlers,
};
