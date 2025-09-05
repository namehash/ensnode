import {BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator} from "@/components/ui/breadcrumb";

//TODO: is there any better way to do this?
export default function Page() {
  return (
    <>
      <BreadcrumbLink href="/mock" className="hidden md:block">UI Mocks</BreadcrumbLink>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem>
        <BreadcrumbPage>ENSNodeConfigInfo</BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );
}
