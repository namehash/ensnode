"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";

import { ENSNamespaceId, NamedRegistrarAction } from "@ensnode/ensnode-sdk";

import { ErrorInfo } from "@/components/error-info";
import { InternalLink } from "@/components/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";
import { formatOmnichainIndexingStatus } from "@/lib/indexing-status";

import {
  DisplayRegistrarActionCard,
  DisplayRegistrarActionCardPlaceholder,
} from "./registration-card";
import { ResolutionStatusIds, type ResolvedRegistrarActions } from "./types";

interface DisplayRegistrarActionsListProps {
  namespaceId: ENSNamespaceId;
  registrarActions: NamedRegistrarAction[];
}

/**
 * Displays a list of {@link NamedRegistrarAction}s.
 */
function DisplayRegistrarActionsList({
  namespaceId,
  registrarActions,
}: DisplayRegistrarActionsListProps) {
  const [animationParent] = useAutoAnimate();

  return (
    <div
      ref={animationParent}
      className="w-full h-fit box-border flex flex-col justify-start items-center gap-3"
    >
      {registrarActions.map((namedRegistrarAction) => (
        <DisplayRegistrarActionCard
          key={namedRegistrarAction.name}
          namespaceId={namespaceId}
          namedRegistrarAction={namedRegistrarAction}
        />
      ))}
    </div>
  );
}

interface DisplayRegistrarActionsListPlaceholderProps {
  recordCount: number;
}

/**
 * Displays a placeholder for a list of {@link NamedRegistrarAction}s.
 */
function DisplayRegistrarActionsListPlaceholder({
  recordCount,
}: DisplayRegistrarActionsListPlaceholderProps) {
  return (
    <div className="space-y-4">
      {[...Array(recordCount)].map((_, idx) => (
        <DisplayRegistrarActionCardPlaceholder key={idx} />
      ))}
    </div>
  );
}

export interface DisplayRegistrarActionsPanelProps {
  namespaceId: ENSNamespaceId;
  resolvedRegistrarActions: ResolvedRegistrarActions;
  title: string;
}

/**
 * Display {@link NamedRegistrarAction}s.
 */
export function DisplayRegistrarActionsPanel({
  namespaceId,
  resolvedRegistrarActions,
  title,
}: DisplayRegistrarActionsPanelProps) {
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();

  switch (resolvedRegistrarActions.resolutionStatus) {
    case ResolutionStatusIds.Initial:
      // we show nothing to avoid a flash of not essential content
      return null;

    case ResolutionStatusIds.UnsupportedConfig:
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-sm:p-3 max-sm:pt-0 flex flex-col gap-4">
            <p>
              Registrar Actions API on the connected ENSNode instance will not be available due to
              unsupported ENSNode config.
            </p>
            <p>
              Registrar Actions API is only available when ENSNode config supports all of the
              following plugins:
            </p>

            <ul>
              {resolvedRegistrarActions.requiredPlugins.map((requiredPluginName) => (
                <li className="inline" key={requiredPluginName}>
                  <Badge variant="secondary">{requiredPluginName}</Badge>{" "}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="gap-6">
            <Button asChild>
              <InternalLink href={retainCurrentRawConnectionUrlParam("/connection")}>
                Check ENSIndexer plugins
              </InternalLink>
            </Button>
          </CardFooter>
        </Card>
      );

    case ResolutionStatusIds.IndexingStatusNotReady:
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-sm:p-3 max-sm:pt-0 flex flex-col gap-4">
            <p>
              Registrar Actions API on the connected ENSNode instance is not currently available.
            </p>
            <p>
              The latest indexed registrations will be available once the omnichain indexing status
              is either of the following:
            </p>

            <ul>
              {resolvedRegistrarActions.supportedIndexingStatusIds.map((supportedStatusId) => (
                <li className="inline">
                  <Badge variant="secondary">
                    {formatOmnichainIndexingStatus(supportedStatusId)}
                  </Badge>{" "}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="gap-6">
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
            <DisplayRegistrarActionsListPlaceholder
              recordCount={resolvedRegistrarActions.placeholderCount}
            />
          </CardContent>
        </Card>
      );

    case ResolutionStatusIds.Unavailable:
      return <ErrorInfo title={title} description={resolvedRegistrarActions.reason} />;

    case ResolutionStatusIds.Available:
      return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DisplayRegistrarActionsList
              namespaceId={namespaceId}
              registrarActions={resolvedRegistrarActions.registrarActions}
            />
          </CardContent>
        </Card>
      );
  }
}
