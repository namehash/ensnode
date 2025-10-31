"use client";

import { useSearchParams } from "next/navigation";

import type { Name } from "@ensnode/ensnode-sdk";

import BreadcrumbsGroup from "@/components/breadcrumbs/group";
import { NameDisplay } from "@/components/identity/utils";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";

export default function Page() {
  const searchParams = useSearchParams();
  const nameParam = searchParams.get("name");
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();
  const exploreNamesBaseHref = retainCurrentRawConnectionUrlParam("/name");

  const name = nameParam ? (decodeURIComponent(nameParam) as Name) : null;

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
