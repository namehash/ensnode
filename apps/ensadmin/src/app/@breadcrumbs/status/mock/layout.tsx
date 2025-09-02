import BreadcrumbsGroup from "@/components/breadcrumbs/group";

export default function Layout({
                                   children,
                               }: {
    children: React.ReactNode;
}) {
    return <BreadcrumbsGroup name="Mock">{children}</BreadcrumbsGroup>;
}