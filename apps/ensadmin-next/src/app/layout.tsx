import { WagmiProvider } from "@/components/providers/wagmi-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { PropsWithChildren } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteName = "ENSAdmin";
const title = "ENSAdmin";
const description = "Explore the ENS Protocol like never before";

//TODO: adapt all metadata content accordingly to instructions
export const metadata: Metadata = {
  title: title,
  description: description,
  metadataBase: new URL("https://admin.ensnode.io/"),
  openGraph: {
    title: {
      template: `${siteName} - %s`,
      default: title,
    },
    description: description,
    url: "/",
    type: "website",
    siteName: siteName,
  },
  twitter: {
    title: {
      template: `${siteName} - %s`,
      default: title,
    },
    card: "summary_large_image",
    site: "@NamehashLabs",
    creator: "@NamehashLabs",
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WagmiProvider>{children}</WagmiProvider>
      </body>
    </html>
  );
}
