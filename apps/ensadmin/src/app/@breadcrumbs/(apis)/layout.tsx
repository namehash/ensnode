import BreadcrumbsGroup from "@/components/breadcrumbs/group";

export default function BreadcrumbsAPIsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BreadcrumbsGroup name="APIs">{children}</BreadcrumbsGroup>;
}
