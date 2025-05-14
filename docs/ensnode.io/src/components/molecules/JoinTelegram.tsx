import { Button, Link } from "@namehash/namekit-react";
import { TelegramIcon } from "@workspace/docs/ensrainbow.io/src/components/atoms/icons/TelegramIcon.tsx";
import { Balancer } from "react-wrap-balancer";
import TelegramBanner from "../../assets/telegram_image.svg";
import MobileTelegramBanner from "../../assets/telegram_mobile_image.svg";

export default function JoinTelegram() {
  return (
    <div className="bg-[linear-gradient(90deg,_#F9FAFB_0%,_#F3F5F7_100%)] max-w-[1216px] w-full h-fit flex flex-col min-[930px]:flex-row justify-center items-center flex-nowrap gap-10 min-[930px]:gap-5 min-[930px]:pl-20 min-[930px]:pr-5 pt-10 min-[930px]:pt-0 rounded-[20px] overflow-hidden">
      <div className="w-4/5 h-fit flex flex-col flex-nowrap items-center min-[930px]:items-start justify-center gap-5 min-[930px]:py-5">
        <Balancer
          as="h2"
          className="self-stretch text-3xl min-[930px]:text-4xl leading-9 min-[930px]:leading-10 font-bold text-black text-center min-[930px]:text-left"
        >
          Become a part of our community in Telegram
        </Balancer>
        <Balancer
          as="p"
          className="text-lg leading-8 min-[930px]:leading-7 font-normal text-gray-500 text-center min-[930px]:text-left"
        >
          Get updates, technical support, and connect with our team building the multichain future.
        </Balancer>
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
