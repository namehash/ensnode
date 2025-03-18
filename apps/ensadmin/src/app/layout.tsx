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

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ENSAdmin",
  description: "Control ENSNode via ENSAdmin Dashboard Interface",
};

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
