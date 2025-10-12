"use client";

import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";

export default function Page() {
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();
  const uiMocksBaseHref = retainCurrentRawConnectionUrlParam("/mock");

  return (
    <>
      <BreadcrumbLink href={uiMocksBaseHref} className="hidden md:block">
        UI Mocks
      </BreadcrumbLink>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem>
        <BreadcrumbPage>RecentRegistrations</BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );
}
