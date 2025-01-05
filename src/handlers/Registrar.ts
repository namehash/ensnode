import { type Context, type Event } from "ponder:registry";
import { domains, registrations } from "ponder:schema";
import type { Hex } from "viem";
import { ENS_ROOT_DOMAIN_NAME, NAMEHASH_ROOT, isLabelValid, makeSubnodeNamehash, tokenIdToLabel } from "../lib/ens-helpers";
import { NsReturnType } from "../lib/plugins";
import { upsertAccount, upsertRegistration } from "../lib/upserts";

type NsType<T extends string> = NsReturnType<T, "/eth">;

const GRACE_PERIOD_SECONDS = 7776000n; // 90 days in seconds

export const makeRegistryHandlers = () => {
  if (!ENS_ROOT_DOMAIN_NAME || !ENS_ROOT_DOMAIN_NAME.endsWith('.eth')) {
    throw new Error("ENS_ROOT_DOMAIN_NAME expected to end with '.eth'");
  }

  async function setNamePreimage(context: Context, name: string, label: Hex, cost: bigint) {
    if (!isLabelValid(name)) return;

    const node = makeSubnodeNamehash(NAMEHASH_ROOT, label);
    const domain = await context.db.find(domains, { id: node });
    if (!domain) throw new Error("domain expected");

    if (domain.labelName !== name) {
      await context.db.update(domains, { id: node }).set({ labelName: name, name: `${name}${ENS_ROOT_DOMAIN_NAME}` });
    }

    await context.db.update(registrations, { id: label }).set({ labelName: name, cost });
  }

  return {
    async handleNameRegistered({
      context,
      event,
    }: {
      context: Context;
      event: Omit<Event<NsType<"BaseRegistrar:NameRegistered">>, "name">;
    }) {
      const { id, owner, expires } = event.args;

      await upsertAccount(context, owner);

      const label = tokenIdToLabel(id);
      const node = makeSubnodeNamehash(NAMEHASH_ROOT, label);

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
    },

    async handleNameRegisteredByController({
      context,
      args: { name, label, cost },
    }: {
      context: Context;
      args: { name: string; label: Hex; cost: bigint };
    }) {
      return await setNamePreimage(context, name, label, cost);
    },

    async handleNameRenewedByController({
      context,
      args: { name, label, cost },
    }: {
      context: Context;
      args: { name: string; label: Hex; cost: bigint };
    }) {
      return await setNamePreimage(context, name, label, cost);
    },

    async handleNameRenewed({
      context,
      event,
    }: {
      context: Context;
      event: Event<NsType<"BaseRegistrar:NameRenewed">>;
    }) {
      const { id, expires } = event.args;

      const label = tokenIdToLabel(id);
      const node = makeSubnodeNamehash(NAMEHASH_ROOT, label);

      await context.db.update(registrations, { id: label }).set({ expiryDate: expires });

      await context.db
        .update(domains, { id: node })
        .set({ expiryDate: expires + GRACE_PERIOD_SECONDS });

      // TODO: log Event
    },

    async handleNameTransferred({
      context,
      args: { tokenId, from, to },
    }: {
      context: Context;
      args: Event<NsType<"BaseRegistrar:Transfer">>["args"];
    }) {
      await upsertAccount(context, to);

      const label = tokenIdToLabel(tokenId);
      const node = makeSubnodeNamehash(NAMEHASH_ROOT, label);

      const registration = await context.db.find(registrations, { id: label });
      if (!registration) return;

      await context.db.update(registrations, { id: label }).set({ registrantId: to });

      await context.db.update(domains, { id: node }).set({ registrantId: to });

      // TODO: log Event
    },
  };
};
