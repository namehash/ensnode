import type { Node } from "../../ens";
import { type NameTokensFilterByDomainId, NameTokensFilterTypes } from "./request";

/**
 * Build a "domain id" filter object for Name Tokens query.
 */
function byDomainId(domainId: Node): NameTokensFilterByDomainId;
function byDomainId(domainId: undefined): undefined;
function byDomainId(domainId: Node | undefined): NameTokensFilterByDomainId | undefined {
  if (typeof domainId === "undefined") {
    return undefined;
  }

  return {
    filterType: NameTokensFilterTypes.ByDomainId,
    domainId: domainId,
  };
}

export const nameTokensFilter = {
  byDomainId,
};
