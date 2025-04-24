import { Button, Link } from "@namehash/namekit-react";
import { TelegramIcon } from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/TelegramIcon.tsx";
import { Balancer } from "react-wrap-balancer";
import TelegramBanner from "../../assets/telegram_image.svg";
import MobileTelegramBanner from "../../assets/telegram_mobile_image.svg";

export default function JoinTelegram() {
  return (
    <div className="bg-telegram_bg max-w-[1216px] w-full h-fit flex flex-col min-[900px]:flex-row justify-center items-center flex-nowrap gap-10 min-[900px]:gap-5 min-[900px]:pl-20 min-[900px]:pr-5 pt-10 min-[900px]:pt-0 rounded-[20px] overflow-hidden">
      <div className="w-4/5 h-fit flex flex-col flex-nowrap items-center min-[900px]:items-start justify-center gap-5 min-[900px]:py-5">
        <Balancer
          as="h2"
          className="self-stretch text-3xl min-[900px]:text-4xl leading-9 min-[900px]:leading-10 font-bold text-black text-center min-[900px]:text-left"
        >
          Become a part of our community in Telegram
        </Balancer>
        <p className="text-lg leading-8 min-[900px]:leading-7 font-normal text-gray-500">
          Run your own ENSNode
        </p>
        <Button asChild size="medium" variant="primary">
          <Link target="_blank" href="http://t.me/ensnode">
            <TelegramIcon /> Join our Telegram
          </Link>
        </Button>
      </div>
      <img
        className="hidden min-[450px]:flex w-auto h-[280px] shrink-0 object-contain bg-no-repeat"
        src={TelegramBanner.src}
        alt="Telegram Banner"
      />
      <img
        className="min-[450px]:hidden flex w-fit h-full shrink-0 object-contain bg-no-repeat"
        src={MobileTelegramBanner.src}
        alt="Telegram Banner"
      />
    </div>
  );
}
