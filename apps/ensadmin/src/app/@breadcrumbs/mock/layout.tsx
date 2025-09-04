import {Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator} from "@/components/ui/breadcrumb";

export default function Layout({
                                   children,
                               }: {
    children: React.ReactNode;
}) {
    return     <Breadcrumb>
        <BreadcrumbList>
            {children}
        </BreadcrumbList>
    </Breadcrumb>
}