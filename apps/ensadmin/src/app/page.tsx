"use server";

import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: Readonly<{ searchParams: Promise<Record<string, unknown>> }>) {
  const searchParamsNative = new URLSearchParams();

  Object.entries(await searchParams).forEach(([key, value]) => {
    searchParamsNative.append(key, String(value));
  });

  redirect(`/status?${searchParamsNative.toString()}`);
}
