"use client";

import { NameDisplay } from "@/components/identity/utils";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";
import { Name } from "@ensnode/ensnode-sdk";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const name = decodeURIComponent(params.name as Name);
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();
  const exploreNamesBaseHref = retainCurrentRawConnectionUrlParam("/name");

  return (
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
  );
}
