import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

import { Inter } from "next/font/google";

import { AppSidebar } from "@/components/app-sidebar";
import { WagmiProvider } from "@/components/providers/wagmi-provider";
import { Provider as QueryProvider } from "@/components/query-client/provider";
import { Header, HeaderActions, HeaderBreadcrumbs, HeaderNav } from "@/components/ui/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ensAdminPublicUrl } from "@/lib/env";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteName = "ENSAdmin";
const title = "ENSAdmin";
const description = "Explore the ENS Protocol like never before";

export async function generateMetadata(): Promise<Metadata> {
  const metadataBaseUrl = ensAdminPublicUrl();

  return {
    title: title,
    description: description,
    /**
     * Note: using Vercel platform for ENSAdmin deployments works best when
     * this function returns undefined and lets default values to be applied.
     * Read more: https://nextjs.org/docs/app/api-reference/functions/generate-metadata#default-value
     */
    metadataBase: metadataBaseUrl ? new URL(metadataBaseUrl) : undefined,
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
        <WagmiProvider>
          <QueryProvider>
            <SidebarProvider>
              <Suspense>
                <AppSidebar />
              </Suspense>
              <SidebarInset>
                <Header>
                  <HeaderNav>
                    <HeaderBreadcrumbs>{breadcrumbs}</HeaderBreadcrumbs>
                  </HeaderNav>
                  <HeaderActions>{actions}</HeaderActions>
                </Header>
                {children}
              </SidebarInset>
            </SidebarProvider>
          </QueryProvider>
        </WagmiProvider>
        <Toaster />
      </body>
    </html>
  );
}
