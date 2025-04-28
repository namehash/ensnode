import { Button, Link } from "@namehash/namekit-react";
import HeaderMobileNavigation from "@workspace/docs/ensnode.io/src/components/molecules/HeaderMobileNavigation.tsx";
import { GithubIcon } from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/GithubIcon.tsx";
import { TelegramIcon } from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/TelegramIcon.tsx";
import { TwitterIcon } from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/TwitterIcon.tsx";
import "../../styles/onScrollHeader.css";
export default function HeaderButtons() {
  return (
    <>
      <div className="hidden sm:flex items-center justify-end gap-1">
        <Button variant="ghost" asChild>
          <Link href="/docs/">
            <p className="onScrollElement text-sm font-medium leading-6">Docs</p>
          </Link>
        </Button>

        <Button variant="ghost" asChild>
          <Link href="https://x.com/NamehashLabs">
            <TwitterIcon className="onScrollElement" />
          </Link>
        </Button>

        <Button variant="ghost" asChild>
          <Link href="https://github.com/namehash/ensnode">
            <GithubIcon className="onScrollElement" />
          </Link>
        </Button>

        <Button variant="ghost" asChild>
          <Link href="http://t.me/ensnode">
            <TelegramIcon className="onScrollElement" />
          </Link>
        </Button>
      </div>
      <div className="sm:hidden flex items-center justify-center gap-1">
        <HeaderMobileNavigation />
      </div>
    </>
  );
}
