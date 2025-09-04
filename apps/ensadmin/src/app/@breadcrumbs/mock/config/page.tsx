import {BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator} from "@/components/ui/breadcrumb";

//TODO: is there any better way to do this?
export default function Page() {
  return (
      <>
          <BreadcrumbItem className="hidden md:block">Mock</BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
              <BreadcrumbPage>Config</BreadcrumbPage>
          </BreadcrumbItem>
      </>
  );
}
