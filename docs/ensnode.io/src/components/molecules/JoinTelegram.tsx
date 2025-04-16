import { Button, Link } from "@namehash/namekit-react";
import { TelegramIcon } from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/TelegramIcon.tsx";
import { Balancer } from "react-wrap-balancer";
import TelegramBanner from "../../assets/telegram_image.svg";

export default function JoinTelegram() {
  return (
    <div className="bg-telegram_bg max-w-[1216px] w-full h-fit flex flex-col sm:flex-row justify-center items-center flex-nowrap gap-10 sm:gap-5 sm:pl-20 sm:pr-5 pt-10 sm:pt-0 rounded-[20px] overflow-hidden">
      <div className="w-4/5 h-fit flex flex-col flex-nowrap items-center sm:items-start justify-center gap-5 sm:py-5">
        <Balancer
          as="h2"
          className="self-stretch text-3xl sm:text-4xl leading-9 sm:leading-10 font-bold text-black text-center sm:text-left"
        >
          Become a part of our community in Telegram
        </Balancer>
        <p className="text-lg leading-8 sm:leading-7 font-normal text-gray-500">
          Run your own ENSNode
        </p>
        <Button asChild size="medium" variant="primary">
          <Link target="_blank" href="https://t.me/namehash">
            <TelegramIcon /> Join our Telegram
          </Link>
        </Button>
      </div>
      <img
        className="relative max-sm:left-24 sm:overflow-hidden w-fit h-full shrink-0 object-contain bg-no-repeat"
        src={TelegramBanner.src}
        alt="Telegram Banner"
      />
    </div>
  );
}
