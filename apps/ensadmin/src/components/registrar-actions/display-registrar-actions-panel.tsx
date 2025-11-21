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
  DisplayRegistrarActionCardMemo,
  DisplayRegistrarActionCardPlaceholder,
} from "./display-registrar-action-card";
import { type StatefulFetchRegistrarActions, StatefulFetchStatusIds } from "./types";

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
        <DisplayRegistrarActionCardMemo
          key={namedRegistrarAction.action.id}
          namespaceId={namespaceId}
          namedRegistrarAction={namedRegistrarAction}
        />
      ))}
    </div>
  );
}

interface DisplayRegistrarActionsListPlaceholderProps {
  itemsPerPage: number;
}

/**
 * Displays a placeholder for a list of {@link NamedRegistrarAction}s.
 */
function DisplayRegistrarActionsListPlaceholder({
  itemsPerPage,
}: DisplayRegistrarActionsListPlaceholderProps) {
  return (
    <div className="space-y-4">
      {[...Array(itemsPerPage)].map((_, idx) => (
        <DisplayRegistrarActionCardPlaceholder key={idx} />
      ))}
    </div>
  );
}

export interface DisplayRegistrarActionsPanelProps {
  namespaceId: ENSNamespaceId;
  registrarActions: StatefulFetchRegistrarActions;
  title: string;
}

/**
 * Display {@link NamedRegistrarAction}s Panel.
 */
export function DisplayRegistrarActionsPanel({
  namespaceId,
  registrarActions,
  title,
}: DisplayRegistrarActionsPanelProps) {
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();

  switch (registrarActions.fetchStatus) {
    case StatefulFetchStatusIds.Connecting:
      // we show nothing to avoid a flash of not essential content
      return null;

    case StatefulFetchStatusIds.Unsupported:
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-sm:p-3 max-sm:pt-0 flex flex-col gap-4">
            <p>The Registrar Actions API is unavailable on the connected ENSNode instance.</p>
            <p>The Registrar Actions API requires all of the following plugins to be activated:</p>

            <ul>
              {registrarActions.requiredPlugins.map((requiredPluginName) => (
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

    case StatefulFetchStatusIds.NotReady:
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-sm:p-3 max-sm:pt-0 flex flex-col gap-4">
            <p>The Registrar Actions API on the connected ENSNode instance is not available yet.</p>
            <p>
              The Registrar Actions API will be available once the omnichain indexing status reaches
              one of the following:
            </p>

            <ul>
              {registrarActions.supportedIndexingStatusIds.map((supportedStatusId) => (
                <li className="inline" key={supportedStatusId}>
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

    case StatefulFetchStatusIds.Loading:
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-sm:p-3 max-sm:pt-0">
            <DisplayRegistrarActionsListPlaceholder itemsPerPage={registrarActions.itemsPerPage} />
          </CardContent>
        </Card>
      );

    case StatefulFetchStatusIds.Error:
      return <ErrorInfo title={title} description={registrarActions.reason} />;

    case StatefulFetchStatusIds.Loaded:
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
              registrarActions={registrarActions.registrarActions}
            />
          </CardContent>
        </Card>
      );
  }
}
