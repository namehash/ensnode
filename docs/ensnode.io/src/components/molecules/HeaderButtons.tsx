import { Button, IconButton, Link } from "@namehash/namekit-react";
import { GithubIcon } from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/GithubIcon.tsx";
import { TelegramIcon } from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/TelegramIcon.tsx";
import { TwitterIcon } from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/TwitterIcon.tsx";
export default function HeaderButtons() {
  return (
    <>
      <div className="hidden sm:flex items-center justify-end gap-1">
        <Button variant="ghost" asChild>
          <Link href="/docs/">Docs</Link>
        </Button>

        <Button variant="ghost" asChild>
          <Link href="https://x.com/NamehashLabs">
            <TwitterIcon className="fill-current" />
          </Link>
        </Button>

        <Button variant="ghost" asChild>
          <Link href="https://github.com/namehash/ensnode">
            <GithubIcon className="fill-current" />
          </Link>
        </Button>

        <Button variant="ghost" asChild>
          <Link href="http://t.me/ensnode">
            <TelegramIcon className="text-[#1F2937]" />
          </Link>
        </Button>
      </div>
      <div className="sm:hidden flex items-center justify-center gap-1">
        <IconButton asChild variant="ghost">
          <Link
            href="https://ensnode.io/ensrainbow/"
            target="_blank"
            size="small"
            className="hover:no-underline nk-underline-none"
          >
            Hamburger
          </Link>
        </IconButton>
      </div>
    </>
  );
}
