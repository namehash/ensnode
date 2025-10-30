import { useMatches, useSearch } from "@tanstack/react-router";

import type { Name } from "@ensnode/ensnode-sdk";

import BreadcrumbsGroup from "@/components/breadcrumbs/group";
import { NameDisplay } from "@/components/identity/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";

export function RouteBreadcrumbs() {
  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];
  const pathname = lastMatch?.pathname || "/";
  const search = useSearch({ strict: false }) as Record<string, any>;
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();

  // Extract name from search params if present
  const nameParam = search?.name;
  const name = nameParam ? (decodeURIComponent(nameParam as string) as Name) : null;

  const renderBreadcrumbs = () => {
    // Connection page
    if (pathname === "/connection") {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage>Connection</BreadcrumbPage>
        </BreadcrumbItem>
      );
    }

    // Status page
    if (pathname === "/status") {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage>Status</BreadcrumbPage>
        </BreadcrumbItem>
      );
    }

    // Registration page
    if (pathname === "/registration") {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage>Registrations</BreadcrumbPage>
        </BreadcrumbItem>
      );
    }

    // Name page
    if (pathname === "/name") {
      const exploreNamesBaseHref = retainCurrentRawConnectionUrlParam("/name");
      return (
        <BreadcrumbsGroup name="ENS Explorer">
          {name ? (
            <>
              <BreadcrumbLink href={exploreNamesBaseHref} className="hidden md:block">
                Names
              </BreadcrumbLink>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  <NameDisplay name={name} />
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            <BreadcrumbItem>
              <BreadcrumbPage>Names</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbsGroup>
      );
    }

    // Inspect pages
    if (pathname.startsWith("/inspect/")) {
      if (pathname === "/inspect/primary-names") {
        return (
          <BreadcrumbItem>
            <BreadcrumbPage>Primary Names Resolution</BreadcrumbPage>
          </BreadcrumbItem>
        );
      }
      if (pathname === "/inspect/primary-name") {
        return (
          <BreadcrumbItem>
            <BreadcrumbPage>Primary Name Resolution</BreadcrumbPage>
          </BreadcrumbItem>
        );
      }
      if (pathname === "/inspect/records") {
        return (
          <BreadcrumbItem>
            <BreadcrumbPage>Records Resolution</BreadcrumbPage>
          </BreadcrumbItem>
        );
      }
      if (pathname === "/inspect/visualizer") {
        return (
          <BreadcrumbItem>
            <BreadcrumbPage>Visualizer</BreadcrumbPage>
          </BreadcrumbItem>
        );
      }
    }

    // API pages
    if (pathname.startsWith("/api/")) {
      if (pathname === "/api/subgraph") {
        return (
          <BreadcrumbsGroup name="APIs">
            <BreadcrumbItem>
              <BreadcrumbPage>Subgraph API</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbsGroup>
        );
      }
    }

    // Mock pages
    if (pathname.startsWith("/mock")) {
      if (pathname === "/mock/") {
        return (
          <BreadcrumbsGroup name="UI Mocks">
            <BreadcrumbItem>
              <BreadcrumbPage>Mocks</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbsGroup>
        );
      }
      if (pathname === "/mock/recent-registrations") {
        return (
          <BreadcrumbsGroup name="UI Mocks">
            <BreadcrumbLink href={retainCurrentRawConnectionUrlParam("/mock")}>
              Mocks
            </BreadcrumbLink>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>RecentRegistrations</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbsGroup>
        );
      }
      if (pathname === "/mock/config-info") {
        return (
          <BreadcrumbsGroup name="UI Mocks">
            <BreadcrumbLink href={retainCurrentRawConnectionUrlParam("/mock")}>
              Mocks
            </BreadcrumbLink>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>ENSNodeConfigInfo</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbsGroup>
        );
      }
      if (pathname === "/mock/indexing-stats") {
        return (
          <BreadcrumbsGroup name="UI Mocks">
            <BreadcrumbLink href={retainCurrentRawConnectionUrlParam("/mock")}>
              Mocks
            </BreadcrumbLink>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>IndexingStats</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbsGroup>
        );
      }
      if (pathname === "/mock/relative-time") {
        return (
          <BreadcrumbsGroup name="UI Mocks">
            <BreadcrumbLink href={retainCurrentRawConnectionUrlParam("/mock")}>
              Mocks
            </BreadcrumbLink>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>RelativeTime</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbsGroup>
        );
      }
      if (pathname === "/mock/display-identity") {
        return (
          <BreadcrumbsGroup name="UI Mocks">
            <BreadcrumbLink href={retainCurrentRawConnectionUrlParam("/mock")}>
              Mocks
            </BreadcrumbLink>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>DisplayIdentity</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbsGroup>
        );
      }
    }

    // Default: return null for unmatched routes
    return null;
  };

  const breadcrumbs = renderBreadcrumbs();

  if (!breadcrumbs) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>{breadcrumbs}</BreadcrumbList>
    </Breadcrumb>
  );
}
