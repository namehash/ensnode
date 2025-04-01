import { Link } from "@namehash/namekit-react";
import { ENSServiceProviderBadge } from "../atoms/ENSServiceProviderBadge.tsx";
import { EmailIcon } from "../atoms/icons/EmailIcon.tsx";
import { FarcasterIcon } from "../atoms/icons/FarcasterIcon.tsx";
import { GithubIcon } from "../atoms/icons/GithubIcon.tsx";
import { TelegramIcon } from "../atoms/icons/TelegramIcon.tsx";
import { TwitterIcon } from "../atoms/icons/TwitterIcon.tsx";
import { NameHashLabsLogo } from "../atoms/logos/NameHashLabsLogo.tsx";

const footerProducts = [
  {
    name: "ENSNode",
    href: "https://ensnode.io/",
  },
  {
    name: "NameAI",
    href: "https://nameai.io/",
  },
  // NameGraph is commented out until NameGraph is ready for launch.
  // {
  //   name: "NameGraph",
  //   href: "https://www.namegraph.dev/",
  // },
  {
    name: "NameGuard",
    href: "https://nameguard.io",
  },
  {
    name: "NameKit",
    href: "https://namekit.io",
  },
  {
    name: "ENS Referral Program",
    href: "https://namehashlabs.org/ens-referral-program",
  },
];

const footerResources = [
  {
    name: "Contact us",
    href: "https://namehashlabs.org/contact",
  },
  {
    name: "Careers",
    href: "https://namehashlabs.org/careers",
  },
  {
    name: "Partners",
    href: "https://namehashlabs.org/partners",
  },
  {
    name: "Brand assets",
    href: "https://namehashlabs.org/brand-assets",
  },
];

type FooterProps = {
  additionalStyles?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export default function Footer({ ...props }: FooterProps) {
  return (
    <section
      className="lg:px-[50px] px-5 flex items-center justify-center w-full border-t border-gray-200"
      {...props}
    >
      <div className="pt-8 pb-5 flex flex-col gap-10 items-start justify-between w-full max-w-[1216px]">
        <div className="w-full gap-5 flex flex-col lg:flex-row lg:justify-between">
          <div className="flex flex-col gap-5">
            <NameHashLabsLogo />

            <p className="text-sm font-light text-gray-500 max-w-[339px] leading-6">
              Founded in 2022, Namehash Labs is a technology organization dedicated to
              infrastructure-level solutions that helps the Ethereum Name Service (ENS) Protocol
              grow.
            </p>

            <ENSServiceProviderBadge />
          </div>

          <div className="flex justify-start">
            <div className="flex flex-col w-[228px] pr-5">
              <span className="mb-2 text-sm font-semibold">Products</span>
              <ul className="flex flex-col">
                {footerProducts.map((product) => {
                  return (
                    <li key={product.name} className="my-2">
                      <Link variant="secondary" size="small" href={product.href}>
                        {product.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex flex-col w-[228px]">
              <span className="mb-2 text-sm font-semibold">Resources</span>
              <ul className="flex flex-col">
                {footerResources.map((resource) => {
                  return (
                    <li key={resource.name} className="my-2">
                      <Link
                        key={resource.name}
                        variant="secondary"
                        size="small"
                        href={resource.href}
                      >
                        {resource.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:border-t lg:border-gray-200 w-full flex flex-col lg:flex-row lg:justify-between gap-5 pt-5">
          <p className="text-gray-500 text-sm leading-5 font-normal">
            © NameHash Labs. All Rights Reserved
          </p>

          <div className="flex gap-3">
            <Link href="https://x.com/NamehashLabs" target="_blank" aria-label="Twitter">
              <TwitterIcon className="hover:text-black text-[#AFAFAF] transition-all duration-200" />
            </Link>

            <Link href="https://github.com/namehash" target="_blank" aria-label="Github">
              <GithubIcon className="hover:text-black text-[#9CA3AF] transition-all duration-200" />
            </Link>

            <Link href="https://warpcast.com/namehash" target="_blank" aria-label="Farcaster">
              <FarcasterIcon className="hover:text-black text-[#9CA3AF] transition-all duration-200" />
            </Link>

            <Link href="https://t.me/namehash" target="_blank" aria-label="Telegram">
              <TelegramIcon className="hover:text-black text-[#AFAFAF] transition-all duration-200" />
            </Link>

            <Link href="mailto:hello@namehashlabs.org" aria-label="Email">
              <EmailIcon className="hover:text-black text-[#9CA3AF] transition-all duration-200" />
            </Link>
          </div>

          <div className="flex space-x-1 not-italic font-normal text-gray-500 text-sm xSmall:font-light">
            <span>
              Made with
              <span className="text-[#EF4444] mx-1">{"❤️"}</span>
              by
            </span>
            <Link
              variant="underline"
              size="small"
              className="!text-black"
              href="https://namehashlabs.org/"
            >
              NameHash Labs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
