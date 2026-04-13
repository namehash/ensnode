import { Popover, Transition } from "@headlessui/react";
import { legacyButtonVariants } from "@namehash/namehash-ui/legacy";
import { MenuIcon } from "@workspace/docs/ensnode.io/src/components/atoms/icons/MenuIcon.tsx";
import { XMarkIcon } from "@workspace/docs/ensnode.io/src/components/atoms/icons/XMarkIcon.tsx";
import { GithubIcon } from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/GithubIcon.tsx";
import { TelegramIcon } from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/TelegramIcon.tsx";
import { TwitterIcon } from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/TwitterIcon.tsx";
import cc from "classcat";
import { Fragment } from "react";

import ENSNode2D from "../../assets/dark-logo.svg";

export default function HeaderMobileNavigation() {
  const MobileNavigationLinks = [
    {
      text: "Docs",
      href: "/docs",
      target: "_self",
    },
    {
      text: "X",
      href: "https://x.com/NamehashLabs",
      target: "_blank",
    },
    {
      text: "GitHub",
      href: "https://github.com/namehash/ensnode",
      target: "_blank",
    },
    {
      text: "Telegram",
      href: "https://t.me/ensnode",
      target: "_blank",
    },
  ];

  return (
    <div className="w-full max-w-sm">
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button className="sm:hidden relative z-30 p-1 mt-1 focus:outline-none focus-visible:outline-2 focus-visible:outline-black">
              <span className="sr-only">Open menu</span>
              <MenuIcon className="w-5 stroke-current" aria-hidden="true" />
            </Popover.Button>
            <Transition
              as={Fragment}
              show={open}
              enter="transition ease duration-250 transform"
              enterFrom="opacity-0 translate-x-full"
              enterTo="opacity-100 translate-x-0"
              leave="transition ease duration-300 transform"
              leaveFrom="opacity-100 translate-x-0"
              leaveTo="opacity-0 translate-x-full"
            >
              <Popover.Panel className="sm:hidden fixed inset-0 z-30 h-screen w-full bg-black">
                <div className="flex h-full flex-col justify-between">
                  <div className="w-full justify-between items-center flex absolute py-[9px] pl-5 pr-3 top-0 left-0 max-w-[640px]">
                    <a
                      href="/"
                      className="h-fit flex justify-center items-center text-black not-italic font-bold tracking-[-0.907px]"
                    >
                      <img src={ENSNode2D.src} className="h-8" alt="ENSNode" />
                    </a>
                    <Popover.Button className="transition rounded-lg border-0 inline-flex items-center whitespace-nowrap underline-none bg-black hover:bg-black/5">
                      {/*NOTE: this results in a browser error (not-breaking) but is directly copied from namekit.io solution*/}
                      <span className="sr-only">Close menu</span>
                      <XMarkIcon className="block h-6 w-6 text-white" aria-hidden="true" />
                    </Popover.Button>
                  </div>
                  <div
                    className={cc([
                      "py-16 flex flex-col h-full justify-center overflow-y-auto scrollbar-styled",
                    ])}
                  >
                    <ul className="py-3 flex flex-col justify-center gap-1">
                      {MobileNavigationLinks.map((link, idx) => (
                        <li
                          key={String(link.text) + idx}
                          className="cursor-pointer text-base leading-6 font-medium text-white w-full"
                        >
                          <a
                            target={link.target}
                            href={link.href}
                            rel={link.target === "_blank" ? "noopener noreferrer" : undefined}
                            className={legacyButtonVariants({ className: "w-full text-white" })}
                          >
                            {link.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="h-fit w-full flex flex-row flex-nowrap justify-center items-center gap-1">
                    <a
                      aria-label="X"
                      href="https://x.com/NamehashLabs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={legacyButtonVariants({ className: "p-2 text-white" })}
                    >
                      <TwitterIcon />
                    </a>
                    <a
                      aria-label="GitHub"
                      href="https://github.com/namehash/ensnode"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={legacyButtonVariants({ className: "p-2 text-white" })}
                    >
                      <GithubIcon />
                    </a>
                    <a
                      aria-label="Telegram"
                      href="https://t.me/ensnode"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={legacyButtonVariants({ className: "p-2 text-white" })}
                    >
                      <TelegramIcon />
                    </a>
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
}
