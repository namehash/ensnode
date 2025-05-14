import GenericTooltip from "@workspace/docs/ensnode.io/src/components/atoms/GenericTooltip.tsx";
import {Balancer} from "react-wrap-balancer";

export default function SearchKeyboardShortcut() {
    const InfoIcon = <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                          stroke="currentColor"
                          class="size-5 cursor-auto hover:fill-gray-100 hover:stroke-gray-500 transition-all duration-200">
        <path strokeLinecap="round" strokeLinejoin="round"
              d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/>
    </svg>;

    return (
        <div className="p-0">
            <GenericTooltip trigger={InfoIcon}>
                <Balancer as="p" className="text-center w-fit max-w-[186px]">Start a search by pressing Ctrl+K on your keyboard</Balancer>
            </GenericTooltip>
        </div>
    );
}
