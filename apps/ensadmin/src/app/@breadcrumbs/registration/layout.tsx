import BreadcrumbsGroup from "@/components/breadcrumbs/group";

export default function BreadcrumbsNameLayout({
                                                  children,
                                              }: {
    children: React.ReactNode;
}) {
    return <BreadcrumbsGroup name="ENS Explorer">{children}</BreadcrumbsGroup>;
}
