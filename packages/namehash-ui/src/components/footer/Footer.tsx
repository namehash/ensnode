import { EnsServiceProviderIcon } from "@/components/icons/ens/EnsServiceProviderIcon.tsx";
import { NameHashLabsIcon } from "@/components/icons/namehash/NameHashLabsIcon.tsx";
import { EfpIcon } from "@/components/icons/socials/EfpIcon.tsx";
import { EmailIcon } from "@/components/icons/socials/EmailIcon.tsx";
import { FarcasterIcon } from "@/components/icons/socials/FarcasterIcon.tsx";
import { GitHubIcon } from "@/components/icons/socials/GitHubIcon.tsx";
import { TelegramIcon } from "@/components/icons/socials/TelegramIcon.tsx";
import { TwitterIcon } from "@/components/icons/socials/TwitterIcon.tsx";

const footerProducts = [
  {
    name: "ENSNode",
    href: "https://ensnode.io/",
  },
  {
    name: "ENSRainbow",
    href: "https://ensrainbow.io",
  },
  {
    name: "ENSAdmin",
    href: "https://ensadmin.io",
  },
  {
    name: "ENS Referral Program",
    href: "/ens-referral-awards",
  },
  {
    name: "ENSAwards",
    href: "https://ensawards.org/",
  },
  {
    name: "NameGraph",
    href: "https://namegraph.dev",
  },
  {
    name: "NameAI",
    href: "https://nameai.io/",
  },
  {
    name: "NameGuard",
    href: "https://nameguard.io",
  },
  {
    name: "NameKit",
    href: "https://namekit.io",
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

export function Footer() {
  return (
    <section className="nhui:lg:px-[50px] nhui:px-5 nhui:flex nhui:items-center nhui:justify-center nhui:w-full nhui:border-t nhui:border-gray-200">
      <div className="nhui:pt-8 nhui:pb-5 nhui:flex nhui:flex-col nhui:gap-10 nhui:items-start nhui:justify-between nhui:w-full nhui:max-w-[1216px]">
        <div className="nhui:w-full nhui:gap-5 nhui:flex nhui:flex-col nhui:lg:flex-row nhui:lg:justify-between">
          <div className="nhui:flex nhui:flex-col nhui:gap-5">
            <NameHashLabsIcon />

            <p className="nhui:text-sm nhui:font-light nhui:text-gray-500 nhui:max-w-[339px] nhui:leading-6">
              Founded in 2022, Namehash Labs is dedicated to developing open source infrastructure
              that helps the Ethereum Name Service (ENS) Protocol grow.
            </p>

            <EnsServiceProviderIcon />
          </div>

          <div className="nhui:flex nhui:justify-start">
            <div className="nhui:flex nhui:flex-col nhui:w-[228px] nhui:pr-5">
              <span className="nhui:mb-2 nhui:text-sm nhui:font-semibold">Products</span>
              <ul className="nhui:flex nhui:flex-col">
                {footerProducts.map((product) => {
                  return (
                    <li key={product.name} className="nhui:my-2">
                      <a
                        href={product.href}
                        target="_blank"
                        rel="noreferrer"
                        className="nhui:transition nhui:cursor-pointer nhui:text-gray-500 nhui:hover:text-black nhui:text-sm"
                      >
                        {product.name}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="nhui:flex nhui:flex-col nhui:w-[228px]">
              <span className="nhui:mb-2 nhui:text-sm nhui:font-semibold">Resources</span>
              <ul className="nhui:flex nhui:flex-col">
                {footerResources.map((resource) => {
                  return (
                    <li key={resource.name} className="nhui:my-2">
                      <a
                        href={resource.href}
                        target="_blank"
                        rel="noreferrer"
                        className="nhui:transition nhui:cursor-pointer nhui:text-gray-500 nhui:hover:text-black nhui:text-sm"
                      >
                        {resource.name}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="nhui:lg:border-t nhui:lg:border-gray-200 nhui:w-full nhui:flex nhui:flex-col nhui:lg:flex-row nhui:lg:justify-between nhui:gap-5 nhui:pt-5">
          <p className="nhui:text-gray-500 nhui:text-sm nhui:leading-5 nhui:font-normal">
            © NameHash Labs. All Rights Reserved
          </p>

          <div className="nhui:flex nhui:gap-3">
            <a
              href="https://x.com/NamehashLabs"
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter"
            >
              <TwitterIcon className="nhui:hover:text-black nhui:text-[#AFAFAF] nhui:transition-all nhui:duration-200" />
            </a>

            <a
              href="https://github.com/namehash"
              target="_blank"
              rel="noreferrer"
              aria-label="Github"
            >
              <GitHubIcon className="nhui:hover:text-black nhui:text-[#9CA3AF] nhui:transition-all nhui:duration-200" />
            </a>

            <a
              href="https://warpcast.com/namehash"
              target="_blank"
              rel="noreferrer"
              aria-label="Farcaster"
            >
              <FarcasterIcon className="nhui:hover:text-black nhui:text-[#9CA3AF] nhui:transition-all nhui:duration-200" />
            </a>

            <a
              href="https://efp.app/namehashlabs.eth"
              target="_blank"
              rel="noreferrer"
              aria-label="EFP"
            >
              <EfpIcon className="nhui:hover:text-black nhui:text-[#AFAFAF] nhui:transition-all nhui:duration-200 nhui:w-6 nhui:h-6" />
            </a>

            <a href="https://t.me/namehash" target="_blank" rel="noreferrer" aria-label="Telegram">
              <TelegramIcon className="nhui:hover:text-black nhui:text-[#AFAFAF] nhui:transition-all nhui:duration-200" />
            </a>

            <a href="mailto:hello@namehashlabs.org" aria-label="Email">
              <EmailIcon className="nhui:hover:text-black nhui:text-[#9CA3AF] nhui:transition-all nhui:duration-200" />
            </a>
          </div>

          <div className="nhui:flex nhui:space-x-1 nhui:not-italic nhui:font-normal nhui:text-gray-500 nhui:text-sm nhui:xSmall:font-light">
            <span>
              Made with
              <span className="nhui:text-[#EF4444] nhui:mx-1">{"❤️"}</span>
              by
            </span>
            <a
              className="nhui:!text-black nhui:text-sm nhui:text-current nhui:underline nhui:decoration-current nhui:underline-offset-[4px] nhui:transition-all nhui:duration-200 nhui:hover:underline-offset-[2px]"
              href="https://namehashlabs.org/"
              target="_blank"
              rel="noreferrer"
            >
              NameHash Labs
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
