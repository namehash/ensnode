import BreadcrumbsGroup from "@/components/breadcrumbs/group";

export default function BreadcrumbsNameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BreadcrumbsGroup name="Latest indexed registrations">{children}</BreadcrumbsGroup>;
}
