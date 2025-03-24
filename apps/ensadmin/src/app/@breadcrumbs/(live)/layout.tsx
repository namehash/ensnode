import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function BreadcrumbsLiveFeedsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">Live Feeds</BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        {children}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
