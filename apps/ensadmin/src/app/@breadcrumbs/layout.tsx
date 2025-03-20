import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function BreadcrumbsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">Platform</BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        {children}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
