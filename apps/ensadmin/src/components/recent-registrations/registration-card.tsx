import type { PropsWithChildren } from "react";
import { zeroAddress } from "viem";

import {
  buildUnresolvedIdentity,
  DefaultableChainId,
  ENSNamespaceId,
  InterpretedName,
  isRegistrarActionReferralAvailable,
  RegistrarAction,
  RegistrarActionReferral,
  RegistrarActionTypes,
  zeroEncodedReferrer,
} from "@ensnode/ensnode-sdk";

import { Duration, RelativeTime } from "@/components/datetime-utils";
import { ResolveAndDisplayIdentity } from "@/components/identity";
import { NameDisplay, NameLink } from "@/components/identity/utils";
import { InternalLink } from "@/components/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useActiveNamespace } from "@/hooks/active/use-active-namespace";
import { getBlockExplorerUrlForTransactionHash } from "@/lib/namespace-utils";
import { cn } from "@/lib/utils";

interface DisplayRegistrationFeatureProps {
  featureName: string;
  className?: string;
}

/**
 * Display an individual feature of a Registration or Renewal.
 */
function DisplayRegistrationFeature({
  featureName,
  className,
  children,
}: PropsWithChildren<DisplayRegistrationFeatureProps>) {
  return (
    <div className={cn("flex flex-col flex-nowrap justify-start items-start", className)}>
      <p className="text-muted-foreground text-sm leading-normal font-normal">{featureName}</p>
      {children}
    </div>
  );
}

interface DisplayReferrerIdentityProps {
  namespaceId: ENSNamespaceId;
  chainId: DefaultableChainId;
  referral: RegistrarActionReferral;
}

/**
 * Display Referrer Identity
 *
 * Displays Identity view for decoded referrer, or a fallback UI.
 */
function DisplayReferrerIdentity({ namespaceId, chainId, referral }: DisplayReferrerIdentityProps) {
  // display a hyphen
  // if encoded referrer is not available or is the zero encoded referrer
  if (!referral.encodedReferrer || referral.encodedReferrer === zeroEncodedReferrer) {
    return <>-</>;
  }

  // display a tooltip with the encoded referrer value
  // if it was available but couldn't be decoded
  if (referral.decodedReferrer === zeroAddress) {
    return (
      <Tooltip delayDuration={1000}>
        <TooltipTrigger>Unknown</TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-gray-50 text-sm text-black text-left shadow-md outline-none w-fit"
        >
          Encoded referrer {referral.encodedReferrer}
        </TooltipContent>
      </Tooltip>
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
 * Display Registration Card Placeholder
 */
export function DisplayRegistrationCardPlaceholder() {
  return (
    <div className="w-full min-h-[80px] box-border flex flex-row max-lg:flex-wrap flex-nowrap justify-between items-center max-lg:gap-3 rounded-xl border p-3 text-sm">
      <DisplayRegistrationFeature featureName="Name" className="w-[30%] min-w-[200px]">
        <div className="animate-pulse mt-1 h-6 bg-muted rounded w-3/5" />
      </DisplayRegistrationFeature>

      <DisplayRegistrationFeature featureName="Registered" className="w-[15%] min-w-[100px]">
        <div className="animate-pulse mt-1 h-6 bg-muted rounded w-full" />
      </DisplayRegistrationFeature>

      <DisplayRegistrationFeature featureName="Duration" className="w-[10%]  min-w-[100px]">
        <div className=" animate-pulse mt-1 h-6 bg-muted rounded w-full" />
      </DisplayRegistrationFeature>

      <DisplayRegistrationFeature
        featureName="Registrant"
        className="w-1/5 overflow-x-auto min-w-[150px]"
      >
        <div className="animate-pulse mt-1 h-6 bg-muted rounded w-3/5" />
      </DisplayRegistrationFeature>

      <DisplayRegistrationFeature featureName="Referrer" className="w-[15%]  min-w-[100px]">
        <div className=" animate-pulse mt-1 h-6 bg-muted rounded w-full" />
      </DisplayRegistrationFeature>
    </div>
  );
}

export interface DisplayRegistrationCardProps {
  registrarAction: RegistrarAction;
  name: InterpretedName;
}

/**
 * Displays the data of a single Registration Action
 */
export function DisplayRegistrationCard({ registrarAction, name }: DisplayRegistrationCardProps) {
  const namespaceId = useActiveNamespace();

  const { registrant, registrationLifecycle, type, referral, transactionHash } = registrarAction;
  const { chainId } = registrationLifecycle.subregistry.subregistryId;

  const chainExplorerUrl = getBlockExplorerUrlForTransactionHash(chainId, transactionHash);
  const maybeRenderAsChainExplorerLink = chainExplorerUrl
    ? ({ children }: PropsWithChildren) => (
        <InternalLink href={chainExplorerUrl.toString()}>{children}</InternalLink>
      )
    : undefined;

  const registrantIdentity = buildUnresolvedIdentity(registrant, namespaceId, chainId);

  return (
    <div className="w-full min-h-[80px] box-border flex flex-row max-lg:flex-wrap flex-nowrap justify-between items-center max-lg:gap-3 rounded-xl border p-3 text-sm">
      <DisplayRegistrationFeature featureName="Name" className="w-[30%] min-w-[200px]">
        <div className="w-full overflow-x-auto">
          <NameLink
            name={name}
            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            <NameDisplay name={name} />
          </NameLink>
        </div>
      </DisplayRegistrationFeature>

      <DisplayRegistrationFeature
        featureName={type === RegistrarActionTypes.Registration ? "Registered" : "Renewed"}
        className="w-[15%] min-w-[100px]"
      >
        <RelativeTime
          timestamp={registrarAction.block.timestamp}
          tooltipPosition="top"
          conciseFormatting={true}
          render={maybeRenderAsChainExplorerLink}
        />
      </DisplayRegistrationFeature>

      <DisplayRegistrationFeature featureName="Duration" className="w-[10%]  min-w-[100px]">
        <Duration
          beginsAt={registrationLifecycle.expiresAt - registrarAction.incrementalDuration}
          endsAt={registrationLifecycle.expiresAt}
        />
      </DisplayRegistrationFeature>

      <DisplayRegistrationFeature
        featureName="Registrant"
        className="w-1/5 overflow-x-auto min-w-[150px]"
      >
        <ResolveAndDisplayIdentity
          identity={registrantIdentity}
          withAvatar={true}
          className="font-medium"
        />
      </DisplayRegistrationFeature>

      <DisplayRegistrationFeature featureName="Referrer" className="w-[15%]  min-w-[100px]">
        <DisplayReferrerIdentity chainId={chainId} namespaceId={namespaceId} referral={referral} />
      </DisplayRegistrationFeature>
    </div>
  );
}
