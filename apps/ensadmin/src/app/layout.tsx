import { WagmiProvider } from "@/components/providers/wagmi-provider";
import type { Metadata } from "next";
import "./globals.css";

import { Inter } from "next/font/google";

import { AppSidebar } from "@/components/app-sidebar";
import { Provider as QueryProvider } from "@/components/query-client/provider";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Suspense } from "react";

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
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
                  <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    {breadcrumbs}
                  </div>
                  {actions}
                </header>
                {children}
              </SidebarInset>
            </SidebarProvider>
          </QueryProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
