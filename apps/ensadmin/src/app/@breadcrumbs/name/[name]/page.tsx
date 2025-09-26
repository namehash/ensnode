"use client";

import { NameDisplay } from "@/components/identity/utils";
import {BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator} from "@/components/ui/breadcrumb";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);

  return (
      <>
          <BreadcrumbLink href="/name" className="hidden md:block">
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
