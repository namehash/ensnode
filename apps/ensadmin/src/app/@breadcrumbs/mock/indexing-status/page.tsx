import {BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator} from "@/components/ui/breadcrumb";

export default function Page() {
  return (
    <>
      <BreadcrumbLink href="/mock" className="hidden md:block">UI Mocks</BreadcrumbLink>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem>
        <BreadcrumbPage>Indexing Status</BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );
}
