import { Duration, RelativeTime } from "@/components/datetime-utils";
import { ResolveAndDisplayIdentity } from "@/components/identity";
import { NameDisplay, NameLink } from "@/components/identity/utils";
import type { Registration } from "@/components/recent-registrations/types";
import { useActiveNamespace } from "@/hooks/active/use-active-namespace";
import { guessChainIdFromRegisteredName } from "@/lib/guess-registration-chain-id";
import { cn } from "@/lib/utils";
import { buildUnresolvedIdentity } from "@ensnode/ensnode-sdk";
import { PropsWithChildren } from "react";

export interface RegistrationCardProps {
  registration: Registration;
}

/**
 * Displays the data of a single Registration
 */
export function RegistrationCard({ registration }: RegistrationCardProps) {
  const namespaceId = useActiveNamespace();

  // "dirty-hack": fallback to guessing that the registration occurred on the ENS root chain
  // TODO: Update our indexed data model for registrations so that this "dirty-hack"
  //       is no longer needed.
  const chainIdGuess = guessChainIdFromRegisteredName(registration.name, namespaceId) ?? undefined;

  const owner = buildUnresolvedIdentity(registration.owner, namespaceId, chainIdGuess);

  return (
    <div className="w-full min-h-[80px] box-border flex flex-row max-lg:flex-wrap flex-nowrap justify-between items-center max-lg:gap-3 rounded-xl border p-3 text-sm">
      <RegistrationCardElement elementName="Name" className="w-[45%] min-w-[200px]">
        <div className="w-full overflow-x-auto">
          <NameLink
            name={registration.name}
            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            <NameDisplay name={registration.name} />
          </NameLink>
        </div>
      </RegistrationCardElement>
      <RegistrationCardElement elementName="Registered" className="w-[15%] min-w-[100px]">
        <RelativeTime timestamp={registration.registeredAt} tooltipPosition="top" />
      </RegistrationCardElement>
      <RegistrationCardElement elementName="Duration" className="w-[10%]  min-w-[100px]">
        <Duration beginsAt={registration.registeredAt} endsAt={registration.expiresAt} />
      </RegistrationCardElement>
      <RegistrationCardElement elementName="Owner" className="w-1/5 overflow-x-auto min-w-[150px]">
        <ResolveAndDisplayIdentity identity={owner} withAvatar={true} className="font-medium" />
      </RegistrationCardElement>
    </div>
  );
}

export function RegistrationCardLoading() {
  return (
    <div className="w-full min-h-[80px] box-border flex flex-row max-lg:flex-wrap flex-nowrap justify-between items-center max-lg:gap-3 rounded-xl border p-3 text-sm">
      <RegistrationCardElement elementName="Name" className="w-[45%] min-w-[200px]">
        <div className="animate-pulse mt-1 h-6 bg-muted rounded w-3/5" />
      </RegistrationCardElement>
      <RegistrationCardElement elementName="Registered" className="w-[15%] min-w-[100px]">
        <div className="animate-pulse mt-1 h-6 bg-muted rounded w-full" />
      </RegistrationCardElement>
      <RegistrationCardElement elementName="Duration" className="w-[10%]  min-w-[100px]">
        <div className=" animate-pulse mt-1 h-6 bg-muted rounded w-full" />
      </RegistrationCardElement>
      <RegistrationCardElement elementName="Owner" className="w-1/5 overflow-x-auto min-w-[150px]">
        <div className="animate-pulse mt-1 h-6 bg-muted rounded w-3/5" />
      </RegistrationCardElement>
    </div>
  );
}

interface RegistrationCardElementProps {
  elementName: string;
  className?: string;
}

const RegistrationCardElement = ({
  elementName,
  className,
  children,
}: PropsWithChildren<RegistrationCardElementProps>) => (
  <div className={cn("flex flex-col flex-nowrap justify-start items-start", className)}>
    <p className="text-muted-foreground text-sm leading-normal font-normal">{elementName}</p>
    {children}
  </div>
);
