import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

import { AppSidebar } from "@/components/app-sidebar";
import { RequireActiveConnection } from "@/components/connections/require-active-connection";
import { RequireSelectedConnection } from "@/components/connections/require-selected-connection";
import { Header, HeaderActions, HeaderBreadcrumbs, HeaderNav } from "@/components/header";
import { SelectedENSNodeProvider } from "@/components/providers/selected-ensnode-provider";
import { QueryClientProvider } from "@/components/query-client/components";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ConnectionsLibraryProvider } from "@/hooks/use-connections-library";
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
          <ConnectionsLibraryProvider>
            <RequireSelectedConnection>
              <SidebarProvider>
                <Suspense>
                  <AppSidebar />
                </Suspense>
                <SidebarInset className="min-w-0">
                  <SelectedENSNodeProvider>
                    <Header>
                      <HeaderNav>
                        <HeaderBreadcrumbs>{breadcrumbs}</HeaderBreadcrumbs>
                      </HeaderNav>
                      <HeaderActions>{actions}</HeaderActions>
                    </Header>
                    <RequireActiveConnection>{children}</RequireActiveConnection>
                  </SelectedENSNodeProvider>
                </SidebarInset>
              </SidebarProvider>
            </RequireSelectedConnection>
          </ConnectionsLibraryProvider>
        </QueryClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
