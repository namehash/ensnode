"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";

import { NamedRegistrarAction, OmnichainIndexingStatusIds, PluginName } from "@ensnode/ensnode-sdk";

import { ErrorInfo } from "@/components/error-info";
import { InternalLink } from "@/components/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";
import { formatOmnichainIndexingStatus } from "@/lib/indexing-status";

import { DisplayRegistrationCard, DisplayRegistrationCardPlaceholder } from "./registration-card";
import { ResolutionStatusIds, type ResolvedRecentRegistrations } from "./types";

interface DisplayRegistrationsListProps {
  registrarActions: NamedRegistrarAction[];
}

/**
 * Displays a list of Registrations and Renewals.
 */
function DisplayRegistrationsList({ registrarActions }: DisplayRegistrationsListProps) {
  const [animationParent] = useAutoAnimate();

  return (
    <div
      ref={animationParent}
      className="w-full h-fit box-border flex flex-col justify-start items-center gap-3"
    >
      {registrarActions.map(({ action, name }) => (
        <DisplayRegistrationCard key={name} registrarAction={action} name={name} />
      ))}
    </div>
  );
}

interface DisplayRegistrationsListPlaceholderProps {
  recordCount: number;
}

/**
 * Displays a placeholder for a list of Registrations and Renewals.
 */
function DisplayRegistrationsListPlaceholder({
  recordCount,
}: DisplayRegistrationsListPlaceholderProps) {
  return (
    <div className="space-y-4">
      {[...Array(recordCount)].map((_, idx) => (
        <DisplayRegistrationCardPlaceholder key={idx} />
      ))}
    </div>
  );
}

export interface DisplayRecentRegistrationProps {
  resolvedRecentRegistrations: ResolvedRecentRegistrations;
  title: string;
}

/**
 * Display Recent Registrations and Renewals
 */
export function DisplayRecentRegistrations({
  resolvedRecentRegistrations,
  title,
}: DisplayRecentRegistrationProps) {
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();

  switch (resolvedRecentRegistrations.resolutionStatus) {
    case ResolutionStatusIds.Disabled:
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-sm:p-3 max-sm:pt-0">
            <p>
              Registrar Action API on the connected ENSNode instance is not currently available.
            </p>
            <p>
              Please ensure that all required ENSIndexer plugins (
              <Badge variant="secondary">{PluginName.Subgraph}</Badge>,{" "}
              <Badge variant="secondary">{PluginName.Basenames}</Badge>,{" "}
              <Badge variant="secondary">{PluginName.Lineanames}</Badge>,{" "}
              <Badge variant="secondary">{PluginName.Registrars}</Badge>) are active, and that the
              Indexing Status is either{" "}
              <Badge variant="secondary">
                {formatOmnichainIndexingStatus(OmnichainIndexingStatusIds.Completed)}
              </Badge>{" "}
              or{" "}
              <Badge variant="secondary">
                {formatOmnichainIndexingStatus(OmnichainIndexingStatusIds.Following)}
              </Badge>
              .
            </p>
          </CardContent>
          <CardFooter className="gap-6">
            <Button asChild>
              <InternalLink href={retainCurrentRawConnectionUrlParam("/connection")}>
                Check ENSIndexer plugins
              </InternalLink>
            </Button>

            <Button asChild>
              <InternalLink href={retainCurrentRawConnectionUrlParam("/status")}>
                Check status
              </InternalLink>
            </Button>
          </CardFooter>
        </Card>
      );

    case ResolutionStatusIds.Unresolved:
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-sm:p-3 max-sm:pt-0">
            <DisplayRegistrationsListPlaceholder
              recordCount={resolvedRecentRegistrations.placeholderCount}
            />
          </CardContent>
        </Card>
      );

    case ResolutionStatusIds.Unavailable:
      return <ErrorInfo title={title} description={resolvedRecentRegistrations.reason} />;

    case ResolutionStatusIds.Available:
      return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DisplayRegistrationsList
              registrarActions={resolvedRecentRegistrations.registrarActions}
            />
          </CardContent>
        </Card>
      );
  }
}
