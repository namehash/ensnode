"use client";

import BreadcrumbsGroup from "@/components/breadcrumbs/group";
import { NameDisplay } from "@/components/identity/utils";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";
import { Name } from "@ensnode/ensnode-sdk";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();
  const nameParam = searchParams.get("name");

  if (!nameParam) return null;

  const name = decodeURIComponent(nameParam as Name);
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();
  const exploreNamesBaseHref = retainCurrentRawConnectionUrlParam("/name");

  return (
    <BreadcrumbsGroup name="ENS Explorer">
      <BreadcrumbLink href={exploreNamesBaseHref} className="hidden md:block">
        Names
      </BreadcrumbLink>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem>
        <BreadcrumbPage>
          <NameDisplay name={name} />
        </BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbsGroup>
  );
}
