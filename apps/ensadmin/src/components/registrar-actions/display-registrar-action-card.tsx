import type { PropsWithChildren } from "react";
import { zeroAddress } from "viem";

import {
  buildUnresolvedIdentity,
  DefaultableChainId,
  ENSNamespaceId,
  isRegistrarActionReferralAvailable,
  NamedRegistrarAction,
  RegistrarActionReferral,
  RegistrarActionTypes,
  zeroEncodedReferrer,
} from "@ensnode/ensnode-sdk";

import { DisplayDuration, RelativeTime } from "@/components/datetime-utils";
import { InfoIcon } from "@/components/icons/InfoIcon";
import { ResolveAndDisplayIdentity } from "@/components/identity";
import { NameDisplay, NameLink } from "@/components/identity/utils";
import { ExternalLink } from "@/components/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getBlockExplorerUrlForTransactionHash } from "@/lib/namespace-utils";
import { cn } from "@/lib/utils";

interface LabeledFieldProps {
  fieldLabel: string;
  className?: string;
}

/**
 * Display a labeled field.
 */
function LabeledField({ fieldLabel, className, children }: PropsWithChildren<LabeledFieldProps>) {
  return (
    <div className={cn("flex flex-col flex-nowrap justify-start items-start", className)}>
      <p className="text-muted-foreground text-sm leading-normal font-normal">{fieldLabel}</p>
      {children}
    </div>
  );
}

interface ResolveAndDisplayReferrerIdentityProps {
  namespaceId: ENSNamespaceId;
  chainId: DefaultableChainId;
  referral: RegistrarActionReferral;
}

/**
 * Resolve and Display Referrer Identity
 *
 * Resolves and displays the identity of the decoded referrer, or a fallback UI.
 */
function ResolveAndDisplayReferrerIdentity({
  namespaceId,
  chainId,
  referral,
}: ResolveAndDisplayReferrerIdentityProps) {
  // if encoded referrer is not available or is the zero encoded referrer then
  // display a hyphen
  if (
    !isRegistrarActionReferralAvailable(referral) ||
    referral.encodedReferrer === zeroEncodedReferrer
  ) {
    return <>-</>;
  }

  // if the encoded referrer was not the zeroEncodedReferrer but couldn't be
  // decoded according to the subjective interpretation rules of
  // ENS Holiday Awards then display a tooltip with details
  if (referral.decodedReferrer === zeroAddress) {
    return (
      <span className="inline-flex align-middle gap-1">
        Unknown
        <Tooltip delayDuration={1000}>
          <TooltipTrigger>
            <InfoIcon className="flex-shrink-0" />
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-gray-50 text-sm text-black text-left shadow-md outline-none w-fit"
          >
            Encoded referrer
            <code className="block">{referral.encodedReferrer}</code> does not follow the formatting
            requirements of ENS Holiday Awards.
          </TooltipContent>
        </Tooltip>
      </span>
    );
  }

  // resolve and display identity for the decodedReferrer address
  const referrerIdentity = buildUnresolvedIdentity(referral.decodedReferrer, namespaceId, chainId);

  return (
    <ResolveAndDisplayIdentity
      identity={referrerIdentity}
      withAvatar={true}
      className="font-medium"
    />
  );
}

/**
 * Display Registrar Action Card Placeholder
 */
export function DisplayRegistrarActionCardPlaceholder() {
  return (
    <div className="w-full min-h-[80px] box-border flex flex-row flex-wrap justify-between items-center max-lg:gap-3 gap-y-3 rounded-xl border p-3 text-sm">
      <LabeledField fieldLabel="Name" className="w-[30%] min-w-[200px]">
        <div className="animate-pulse mt-1 h-6 bg-muted rounded w-3/5" />
      </LabeledField>

      <LabeledField fieldLabel="Registered" className="w-[15%] min-w-[140px]">
        <div className="animate-pulse mt-1 h-6 bg-muted rounded w-4/5" />
      </LabeledField>

      <LabeledField fieldLabel="Duration" className="w-[10%] min-w-[140px]">
        <div className=" animate-pulse mt-1 h-6 bg-muted rounded w-4/5" />
      </LabeledField>

      <LabeledField fieldLabel="Registrant" className="w-1/5 min-w-[140px]">
        <div className="animate-pulse mt-1 h-6 bg-muted rounded w-3/5" />
      </LabeledField>

      <LabeledField fieldLabel="Referrer" className="w-[15%]  min-w-[140px]">
        <div className=" animate-pulse mt-1 h-6 bg-muted rounded w-full" />
      </LabeledField>
    </div>
  );
}

export interface DisplayRegistrarActionCardProps {
  namespaceId: ENSNamespaceId;
  namedRegistrarAction: NamedRegistrarAction;
}

/**
 * Display a single Registrar Action
 */
export function DisplayRegistrarActionCard({
  namespaceId,
  namedRegistrarAction,
}: DisplayRegistrarActionCardProps) {
  const { registrant, registrationLifecycle, type, referral, transactionHash } =
    namedRegistrarAction.action;
  const { chainId } = registrationLifecycle.subregistry.subregistryId;

  const transactionDetailUrl = getBlockExplorerUrlForTransactionHash(chainId, transactionHash);
  const withTransactionLink = ({ children }: PropsWithChildren) =>
    // wrap `children` content with a transaction link only if the URL is defined
    transactionDetailUrl ? (
      <ExternalLink href={transactionDetailUrl.toString()}>{children}</ExternalLink>
    ) : (
      children
    );

  const registrantIdentity = buildUnresolvedIdentity(registrant, namespaceId, chainId);

  return (
    <div className="w-full min-h-[80px] box-border flex flex-row flex-wrap justify-between items-center max-lg:gap-3 gap-y-3 rounded-xl border p-3 text-sm">
      <LabeledField fieldLabel="Name" className="w-[30%] min-w-[200px]">
        <div className="w-full overflow-x-auto">
          <NameLink
            name={namedRegistrarAction.name}
            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            <NameDisplay name={namedRegistrarAction.name} />
          </NameLink>
        </div>
      </LabeledField>

      <LabeledField
        fieldLabel={type === RegistrarActionTypes.Registration ? "Registered" : "Renewed"}
        className="w-[15%] min-w-[140px]"
      >
        <RelativeTime
          timestamp={namedRegistrarAction.action.block.timestamp}
          tooltipPosition="top"
          conciseFormatting={true}
          contentWrapper={withTransactionLink}
        />
      </LabeledField>

      <LabeledField fieldLabel="Duration" className="w-[10%]  min-w-[140px]">
        <DisplayDuration duration={namedRegistrarAction.action.incrementalDuration} />
      </LabeledField>

      <LabeledField fieldLabel="Registrant" className="w-1/5 overflow-x-auto min-w-[140px]">
        <ResolveAndDisplayIdentity
          identity={registrantIdentity}
          withAvatar={true}
          className="font-medium"
        />
      </LabeledField>

      <LabeledField fieldLabel="Referrer" className="w-[15%] min-w-[140px]">
        <ResolveAndDisplayReferrerIdentity
          chainId={chainId}
          namespaceId={namespaceId}
          referral={referral}
        />
      </LabeledField>
    </div>
  );
}
