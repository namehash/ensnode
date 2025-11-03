import { desc, eq } from "drizzle-orm/sql";

import {
  registrarAction,
  registrarEvent,
  registration,
  subgraph_domain,
} from "@ensnode/ensnode-schema";
import {
  CurrencyIds,
  type InterpretedLabel,
  type InterpretedName,
  type RegistrarActionWithRegistration,
  RegistrarEventNames,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

const DEFAULT_REGISTRAR_ACTIONS_LIMIT = 20;

export async function findRegistrarActions(
  limit: number = DEFAULT_REGISTRAR_ACTIONS_LIMIT,
): Promise<RegistrarActionWithRegistration[]> {
  const records = await db
    .select({
      registrarAction,

      registration,

      registrarEvent: registrarEvent,

      domain: {
        labelName: subgraph_domain.labelName,
        name: subgraph_domain.name,
      },
    })
    .from(registrarAction)
    .innerJoin(registrarEvent, eq(registrarAction.id, registrarEvent.id))
    .innerJoin(registration, eq(registrarAction.node, registration.node))
    .innerJoin(subgraph_domain, eq(registrarAction.node, subgraph_domain.id))
    .orderBy(desc(registrarEvent.blockTimestamp))
    .limit(limit);

  return records.map((record) => {
    if (!record.domain.labelName) {
      throw new Error(`Domain 'label' must exists for '${record.registrarAction.node}' node.`);
    }
    if (!record.domain.name) {
      throw new Error(`Domain 'name' must exists for '${record.registrarAction.node}' node.`);
    }

    switch (record.registrarEvent.name) {
      case RegistrarEventNames.NameRegistered:
      case RegistrarEventNames.NameRenewed:
        // all good, no-op;
        break;

      case RegistrarEventNames.ControllerAdded:
      case RegistrarEventNames.ControllerRemoved: {
        throw new Error(
          `RegistrarEvent 'name' must be either '${RegistrarEventNames.NameRegistered}' or '${RegistrarEventNames.NameRenewed}'.`,
        );
      }
    }

    return {
      id: record.registrarAction.id,

      type: record.registrarAction.type,
      node: record.registrarAction.node,

      baseCost: {
        amount: record.registrarAction.baseCost,
        currency: CurrencyIds.ETH,
      },
      premium: {
        amount: record.registrarAction.premium,
        currency: CurrencyIds.ETH,
      },
      total: {
        amount: record.registrarAction.total,
        currency: CurrencyIds.ETH,
      },

      incrementalDuration: Number(record.registrarAction.incrementalDuration),

      registrant: record.registrarAction.registrant,
      encodedReferrer: record.registrarAction.encodedReferrer,
      decodedReferrer: record.registrarAction.decodedReferrer,

      registration: {
        node: record.registration.node,
        parentNode: record.registration.parentNode,
        expiresAt: Number(record.registration.expiresAt),
        label: record.domain.labelName as InterpretedLabel, // database stores InterpretedLabel value
        name: record.domain.name as InterpretedName, // database stores InterpretedName value
      },

      event: {
        id: record.registrarEvent.id,
        chainId: record.registrarEvent.chainId,
        name: record.registrarEvent.name,
        block: {
          number: Number(record.registrarEvent.blockNumber),

          timestamp: Number(record.registrarEvent.blockTimestamp),
        },
        contractAddress: record.registrarEvent.contractAddress,
        transactionHash: record.registrarEvent.transactionHash,
        logIndex: record.registrarEvent.logIndex,
      },
    };
  });
}
