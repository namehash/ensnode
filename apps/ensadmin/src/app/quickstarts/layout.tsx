import { Metadata } from "next";

const title = "ENS GraphQL API Quickstarts";
const description =
  "Get started with ENS GraphQL API using your preferred client library";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
  },
  twitter: {
    title,
    description,
  },
};

export default function QuickstartsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="max-w-3xl mx-auto p-6">{children}</div>;
}
