"use client";

import { NameDisplay } from "@namehash/namehash-ui";
import { useSearchParams } from "next/navigation";

import { isInterpretedName, type Name } from "@ensnode/ensnode-sdk";

import BreadcrumbsGroup from "@/components/breadcrumbs/group";
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

  const name = nameParam ? (nameParam as Name) : null;

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
              {isInterpretedName(name) ? <NameDisplay name={name} /> : name}
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
