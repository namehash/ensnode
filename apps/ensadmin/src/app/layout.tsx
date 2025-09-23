import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

import { AppSidebar } from "@/components/app-sidebar";
import { ActiveENSNodeProvider } from "@/components/providers/active-ensnode-provider";
import { QueryClientProvider } from "@/components/query-client/components";
import { RequireActiveENSNodeConfig } from "@/components/require-active-ensnode-config";
import { RequireActiveENSNodeConnection } from "@/components/require-active-ensnode-connection";
import { SidebarInset, SidebarProvider } from "@/components/shadcn/sidebar";
import { Toaster } from "@/components/shadcn/sonner";
import { Header, HeaderActions, HeaderBreadcrumbs, HeaderNav } from "@/components/ui/header";
import { ENSNodeConnectionsProvider } from "@/hooks/ensnode-connections";
import { ensAdminPublicUrl } from "@/lib/env";
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteName = "ENSAdmin";
const title = "ENSAdmin";
const description = "Explore the ENS Protocol like never before";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: title,
    description: description,
    metadataBase: ensAdminPublicUrl(),
    openGraph: {
      title: {
        template: `${siteName} - %s`,
        default: title,
      },
      description: description,
      url: "/",
      type: "website",
      siteName: siteName,
      images: ["/opengraph-image.png"],
    },
    twitter: {
      title: {
        template: `${siteName} - %s`,
        default: title,
      },
      card: "summary_large_image",
      site: "@NamehashLabs",
      creator: "@NamehashLabs",
      images: ["/twitter-image.png"],
    },
  };
}

export default function Layout({
  children,
  breadcrumbs,
  actions,
}: {
  children: React.ReactNode;
  breadcrumbs: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <QueryClientProvider>
          <ENSNodeConnectionsProvider>
            <RequireActiveENSNodeConnection>
              <SidebarProvider>
                <Suspense>
                  <AppSidebar />
                </Suspense>
                <SidebarInset className="min-w-0">
                  <ActiveENSNodeProvider>
                    <Header>
                      <HeaderNav>
                        <HeaderBreadcrumbs>{breadcrumbs}</HeaderBreadcrumbs>
                      </HeaderNav>
                      <HeaderActions>{actions}</HeaderActions>
                    </Header>
                    <RequireActiveENSNodeConfig>{children}</RequireActiveENSNodeConfig>
                  </ActiveENSNodeProvider>
                </SidebarInset>
              </SidebarProvider>
            </RequireActiveENSNodeConnection>
          </ENSNodeConnectionsProvider>
        </QueryClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
