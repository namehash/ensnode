import type { Metadata } from "next";
import "./globals.css";

import { LayoutWrapper } from "@/components/layout-wrapper";
import { QueryClientProvider } from "@/components/query-client/components";
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
            <LayoutWrapper breadcrumbs={breadcrumbs} actions={actions}>
              {children}
            </LayoutWrapper>
          </ConnectionsLibraryProvider>
        </QueryClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
