import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function SplashPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 md:gap-8 px-4 text-center select-none">
        <div className="flex items-center gap-2 md:gap-4 select-none">
          <Image
            src="/ensadmin-logo.svg"
            alt="ENSAdmin Logo"
            width={64}
            height={64}
            priority
            className="w-8 md:w-16"
          />
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">ENSAdmin</h1>
        </div>

        <p className="md:text-xl text-muted-foreground max-w-md">
          Explore the ENS Protocol like never before.
        </p>

        <Button asChild size="lg">
          <Link href="/connection">View Connection</Link>
        </Button>
      </div>
    </div>
  );
}
