import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function SplashPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-3">
      <div className="flex flex-col items-center gap-1 text-center bg-[#F9FAFB] p-8 md:p-16 rounded-2xl border border-gray-300 shadow-sm max-w-lg">
        <div className="relative w-full aspect-[1056/820]">
          <img src="/ensadmin-illustration.png" alt="ENSAdmin" className="object-contain" />
        </div>

        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-4">
            <img src="/ensadmin-logo.svg" alt="ENSAdmin Logo" width={64} height={64} />
            <h1 className="text-5xl font-bold tracking-tight select-none">ENSAdmin</h1>
          </div>

          <p className="md:text-xl text-muted-foreground max-w-md">
            Explore the ENS Protocol like never before
          </p>

          <Button asChild size="lg">
            <Link href="/connection">View My Connection</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
