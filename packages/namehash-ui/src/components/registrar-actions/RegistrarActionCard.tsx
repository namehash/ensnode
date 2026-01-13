import { Info as InfoIcon, CircleQuestionMark as QuestionmarkIcon } from "lucide-react";
import { memo, type PropsWithChildren, type ReactNode } from "react";
import { zeroAddress } from "viem";

import type {
  DefaultableChainId,
  ENSNamespaceId,
  NamedRegistrarAction,
  RegistrarActionReferral,
  UnixTimestamp,
} from "@ensnode/ensnode-sdk";
import {
  buildUnresolvedIdentity,
  isRegistrarActionReferralAvailable,
  RegistrarActionTypes,
  ZERO_ENCODED_REFERRER,
} from "@ensnode/ensnode-sdk";

import { useIsMobile } from "../../hooks/useIsMobile";
import { getBlockExplorerTransactionDetailsUrl } from "../../utils/blockExplorers";
import { cn } from "../../utils/cn";
import { DisplayDuration } from "../datetime/DisplayDuration";
import { RelativeTime } from "../datetime/RelativeTime";
import type { IdentityLinkDetails } from "../identity/Identity";
import { NameDisplay } from "../identity/Name";
import {
  ResolveAndDisplayIdentity,
  type ResolveAndDisplayIdentityProps,
} from "../identity/ResolveAndDisplayIdentity";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface LabeledFieldProps {
  fieldLabel: string;
  className?: string;
}

/**
 * Display a labeled field.
 */
function LabeledField({ fieldLabel, className, children }: PropsWithChildren<LabeledFieldProps>) {
  return (
    <div
      className={cn(
        "nhui:max-sm:w-full nhui:flex nhui:flex-row nhui:sm:flex-col nhui:flex-nowrap nhui:justify-between nhui:sm:justify-center nhui:items-start nhui:gap-0 nhui:max-sm:self-stretch",
        className,
      )}
    >
      <p className="nhui:text-muted-foreground nhui:text-sm nhui:leading-normal nhui:font-normal">
        {fieldLabel}
      </p>
      {children}
    </div>
  );
}

interface ResolveAndDisplayReferrerIdentityProps
  extends Omit<ResolveAndDisplayIdentityProps, "identity"> {
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
  accelerate = true,
  withLink = true,
  identityLinkDetails,
  withTooltip = true,
  withAvatar = false,
  withIdentifier = true,
  className,
}: ResolveAndDisplayReferrerIdentityProps) {
  // if encoded referrer is not available or is the zero encoded referrer then
  if (
    !isRegistrarActionReferralAvailable(referral) ||
    referral.encodedReferrer === ZERO_ENCODED_REFERRER
  ) {
    // when we only want to display avatar (without textual identifier) don't display anything (return an empty placeholder).
    // Otherwise, display a hyphen with no avatar
    return withAvatar && !withIdentifier ? (
      <div className="nhui:w-10 nhui:h-10" />
    ) : (
      <p className="nhui:h-[21px]">-</p>
    );
  }

  // if the encoded referrer was not the zeroEncodedReferrer but couldn't be
  // decoded according to the subjective interpretation rules of
  // the current ENS Referral Awards program then display a tooltip with details
  if (referral.decodedReferrer === zeroAddress) {
    // when we only want to display avatar (without textual identifier) use a dedicated placeholder.
    // Otherwise, display "unknown" plus the placeholder.
    const unknownAvatarPlaceholder = (className?: string, iconSize = 24) => (
      <div
        className={cn(
          "nhui:flex nhui:justify-center nhui:items-center nhui:rounded-full nhui:bg-gray-200",
          className,
          !withAvatar && "nhui:hidden",
        )}
      >
        <QuestionmarkIcon size={iconSize} className="nhui:text-gray-400" />
      </div>
    );

    return withAvatar && !withIdentifier ? (
      unknownAvatarPlaceholder("nhui:w-10 nhui:h-10", 24)
    ) : (
      <span className="nhui:h-[21px] nhui:inline-flex nhui:items-center nhui:gap-2 nhui:font-medium">
        {unknownAvatarPlaceholder("nhui:w-5 nhui:h-5", 16)}
        Unknown
        <Tooltip delayDuration={250}>
          <TooltipTrigger>
            <InfoIcon size={16} className="nhui:shrink-0 nhui:fill-neutral-300 nhui:text-white" />
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="nhui:bg-gray-50 nhui:text-sm nhui:text-black nhui:text-left nhui:shadow-md nhui:outline-hidden nhui:w-fit"
          >
            Encoded referrer
            <code className="nhui:block">{referral.encodedReferrer}</code> does not follow the
            formatting requirements of incentive programs.
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
      namespaceId={namespaceId}
      accelerate={accelerate}
      withAvatar={withAvatar}
      withTooltip={withTooltip}
      withIdentifier={withIdentifier}
      className={className}
      withLink={withLink}
      identityLinkDetails={identityLinkDetails}
    />
  );
}

export interface RegistrarActionCardLoadingProps {
  showReferrer?: boolean;
}

/**
 * Display Registrar Action Card loading state
 */
export function RegistrarActionCardLoading({
  showReferrer = true,
}: RegistrarActionCardLoadingProps) {
  const isMobile = useIsMobile();

  return (
    <div
      className="nhui:w-full nhui:min-h-[80px] nhui:box-border nhui:flex nhui:flex-col nhui:sm:flex-row nhui:flex-wrap nhui:justify-start nhui:sm:justify-between nhui:items-start
    nhui:sm:items-center nhui:gap-2 nhui:p-4 nhui:sm:p-6 nhui:sm:gap-y-5 nhui:rounded-2xl nhui:border nhui:border-gray-200 nhui:text-sm nhui:bg-white"
    >
      <LabeledField fieldLabel="Name" className="nhui:w-[15%] nhui:min-w-[162px]">
        <div className="nhui:animate-pulse nhui:h-[14px] nhui:mt-[4px] nhui:mb-[3px] nhui:bg-gray-200 nhui:rounded-sm nhui:w-1/4 nhui:sm:w-4/5" />
      </LabeledField>

      <LabeledField fieldLabel="Registrar action" className="nhui:w-[15%] nhui:min-w-[110px]">
        <div className="nhui:animate-pulse nhui:h-[14px] nhui:mt-[4px] nhui:mb-[3px] nhui:bg-gray-200 nhui:rounded-sm nhui:w-1/5 nhui:sm:w-3/4" />
      </LabeledField>

      <LabeledField fieldLabel="Duration" className="nhui:w-[10%] nhui:min-w-[110px]">
        <div className="nhui:animate-pulse nhui:h-[14px] nhui:mt-[4px] nhui:mb-[3px] nhui:bg-gray-200 nhui:rounded-sm nhui:w-1/4 nhui:sm:w-2/3" />
      </LabeledField>

      <div className="nhui:flex nhui:flex-row nhui:flex-nowrap nhui:justify-start nhui:items-center nhui:gap-3 nhui:max-sm:w-full nhui:w-[15%] nhui:min-w-[162px]">
        {!isMobile && (
          <div className="nhui:animate-pulse nhui:w-10 nhui:h-10 nhui:bg-gray-200 nhui:rounded-full" />
        )}
        <LabeledField fieldLabel="Registrant" className="nhui:sm:min-w-[110px]">
          <div className="nhui:w-full nhui:flex nhui:flex-row nhui:flex-nowrap nhui:max-sm:justify-end nhui:justify-start nhui:items-center nhui:gap-2">
            {isMobile && (
              <div className="nhui:animate-pulse nhui:w-5 nhui:h-5 nhui:bg-gray-200 nhui:rounded-full" />
            )}
            <div className="nhui:animate-pulse nhui:h-[14px] nhui:mt-[4px] nhui:mb-[3px] nhui:bg-gray-200 nhui:rounded-sm nhui:w-1/4 nhui:sm:w-4/5" />
          </div>
        </LabeledField>
      </div>

      {showReferrer && (
        <div className="nhui:flex nhui:flex-row nhui:flex-nowrap nhui:justify-start nhui:items-center nhui:gap-3 nhui:max-sm:w-full nhui:w-[15%] nhui:min-w-[162px]">
          {!isMobile && (
            <div className="nhui:animate-pulse nhui:w-10 nhui:h-10 nhui:bg-gray-200 nhui:rounded-full" />
          )}
          <LabeledField fieldLabel="Referrer" className="nhui:sm:min-w-[110px]">
            <div className="nhui:w-full nhui:flex nhui:flex-row nhui:flex-nowrap nhui:max-sm:justify-end nhui:justify-start nhui:items-center nhui:gap-2">
              {isMobile && (
                <div className="nhui:animate-pulse nhui:w-5 nhui:h-5 nhui:bg-gray-200 nhui:rounded-full" />
              )}
              <div className="nhui:animate-pulse nhui:h-[14px] nhui:mt-[4px] nhui:mb-[3px] nhui:bg-gray-200 nhui:rounded-sm nhui:w-1/4 nhui:sm:w-3/5" />
            </div>
          </LabeledField>
        </div>
      )}

      <LabeledField fieldLabel="Incentive program" className="nhui:w-[15%] nhui:min-w-[162px]">
        <div className="nhui:animate-pulse nhui:h-[14px] nhui:mt-[4px] nhui:mb-[3px] nhui:bg-gray-200 nhui:rounded-sm nhui:w-1/4 nhui:sm:w-4/5" />
      </LabeledField>
    </div>
  );
}

export interface RegistrarActionCardProps {
  namespaceId: ENSNamespaceId;
  namedRegistrarAction: NamedRegistrarAction;
  now: UnixTimestamp;
  links: {
    name: IdentityLinkDetails;
    registrant: IdentityLinkDetails;
    referrer?: IdentityLinkDetails;
  };
  showReferrer?: boolean;
  referralProgramField?: ReactNode;
}

/**
 * Display a single Registrar Action
 */
export function RegistrarActionCard({
  namespaceId,
  namedRegistrarAction,
  now,
  links,
  showReferrer = true,
  referralProgramField,
}: RegistrarActionCardProps) {
  const isMobile = useIsMobile();
  const { registrant, registrationLifecycle, type, referral, transactionHash } =
    namedRegistrarAction.action;
  const { chainId } = registrationLifecycle.subregistry.subregistryId;

  const transactionDetailUrl = getBlockExplorerTransactionDetailsUrl(chainId, transactionHash);
  const withTransactionLink = ({ children }: PropsWithChildren) =>
    // wrap `children` content with a transaction link only if the URL is defined
    transactionDetailUrl ? (
      <a
        target="_blank"
        className="nhui:w-fit nhui:text-blue-600 nhui:font-medium nhui:hover:underline nhui:hover:underline-offset-[25%]"
        href={transactionDetailUrl.toString()}
      >
        {children}
      </a>
    ) : (
      children
    );

  const registrantIdentity = buildUnresolvedIdentity(registrant, namespaceId, chainId);

  return (
    <div
      className="nhui:w-full nhui:min-h-[80px] nhui:box-border nhui:flex nhui:flex-col nhui:sm:flex-row nhui:flex-wrap nhui:justify-start nhui:sm:justify-between
    nhui:items-start nhui:gap-2 nhui:p-4 nhui:sm:p-6 nhui:sm:gap-y-5 nhui:rounded-2xl nhui:border nhui:border-gray-200 nhui:text-sm nhui:bg-white"
    >
      <LabeledField fieldLabel="Name" className="nhui:w-[15%] nhui:min-w-[162px]">
        <a
          target="_blank"
          href={links.name.link.href}
          className="nhui:max-sm:max-w-3/4 nhui:sm:w-full nhui:box-border nhui:overflow-x-auto nhui:text-blue-600 nhui:font-medium nhui:hover:underline nhui:hover:underline-offset-[25%] nhui:whitespace-nowrap"
        >
          <NameDisplay name={namedRegistrarAction.name} className="nhui:h-[21px]" />
        </a>
      </LabeledField>

      <LabeledField
        fieldLabel={type === RegistrarActionTypes.Registration ? "Registered" : "Renewed"}
        className="nhui:w-[15%] nhui:min-w-[110px]"
      >
        <p className="nhui:h-[21px] nhui:font-medium">
          <RelativeTime
            timestamp={namedRegistrarAction.action.block.timestamp}
            tooltipPosition="top"
            conciseFormatting={true}
            contentWrapper={withTransactionLink}
            relativeTo={now}
          />
        </p>
      </LabeledField>

      <LabeledField fieldLabel="Duration" className="nhui:w-[10%] nhui:min-w-[110px]">
        <p className="nhui:h-[21px] nhui:font-medium">
          <DisplayDuration duration={namedRegistrarAction.action.incrementalDuration} />
        </p>
      </LabeledField>

      <div className="nhui:flex nhui:flex-row nhui:flex-nowrap nhui:justify-start nhui:items-center nhui:gap-3 nhui:max-sm:w-full nhui:w-[15%] nhui:min-w-[162px]">
        {!isMobile && (
          <ResolveAndDisplayIdentity
            identity={registrantIdentity}
            namespaceId={namespaceId}
            withAvatar={true}
            withTooltip={false}
            withIdentifier={false}
            identityLinkDetails={links.registrant}
          />
        )}
        <LabeledField fieldLabel="Registrant" className="nhui:sm:min-w-[110px]">
          <ResolveAndDisplayIdentity
            identity={registrantIdentity}
            namespaceId={namespaceId}
            withAvatar={isMobile}
            withTooltip={false}
            className="nhui:font-medium nhui:sm:max-[1220px]:max-w-[110px] nhui:min-[1220px]:max-w-[140px]"
            identityLinkDetails={links.registrant}
          />
        </LabeledField>
      </div>

      {showReferrer && (
        <div className="nhui:flex nhui:flex-row nhui:flex-nowrap nhui:justify-start nhui:items-center nhui:gap-3 nhui:max-sm:w-full nhui:w-[15%] nhui:min-w-[162px]">
          {!isMobile && (
            <ResolveAndDisplayReferrerIdentity
              chainId={chainId}
              namespaceId={namespaceId}
              referral={referral}
              withAvatar={true}
              withIdentifier={false}
              withTooltip={false}
              identityLinkDetails={links.referrer}
            />
          )}
          <LabeledField fieldLabel="Referrer" className="nhui:w-[15%] nhui:min-w-[110px]">
            <ResolveAndDisplayReferrerIdentity
              chainId={chainId}
              namespaceId={namespaceId}
              referral={referral}
              withAvatar={isMobile}
              withIdentifier={true}
              withTooltip={false}
              identityLinkDetails={links.referrer}
            />
          </LabeledField>
        </div>
      )}

      {referralProgramField !== undefined && referralProgramField}
    </div>
  );
}

export const RegistrarActionCardMemo = memo(RegistrarActionCard);

// TODO: Copied from ENSAwards (as a newer version) - performed some refactor actions
//  to make the component usable across all our apps, but further alignment might be needed
