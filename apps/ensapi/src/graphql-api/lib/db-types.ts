import type * as schema from "@ensnode/ensnode-schema";
import type { RequiredAndNotNull } from "@ensnode/ensnode-sdk";

//////////
// Domain
//////////

export type Domain = typeof schema.domain.$inferSelect;

////////////
// Registry
////////////

export type Registry = typeof schema.registry.$inferSelect;

export type RegistryInterface = Pick<Registry, "type" | "id">;
export type RegistryContract = RegistryInterface &
  RequiredAndNotNull<Registry, "chainId" | "address">;
export type ImplicitRegistry = RegistryInterface & RequiredAndNotNull<Registry, "parentDomainNode">;
