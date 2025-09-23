import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/shadcn/breadcrumb";

export default function Page() {
  return (
    <>
      <BreadcrumbLink href="/mock" className="hidden md:block">
        UI Mocks
      </BreadcrumbLink>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem>
        <BreadcrumbPage>ENSNodeConfigInfo</BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );
}
