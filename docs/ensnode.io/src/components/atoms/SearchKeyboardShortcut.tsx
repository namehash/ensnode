import { Tooltip } from "@namehash/namehash-ui/legacy";
import { Balancer } from "react-wrap-balancer";

export default function SearchKeyboardShortcut() {
  const InfoButton = (
    <button
      type="button"
      aria-label="Search keyboard shortcut info"
      className="p-0 bg-transparent border-0 cursor-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 rounded-full"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
        className="size-5 hover:fill-gray-100 hover:stroke-gray-500 transition-all duration-200"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
        />
      </svg>
    </button>
  );

  return (
    <div className="p-0">
      <Tooltip trigger={InfoButton} withDelay>
        <Balancer as="p" className="text-center w-fit max-w-[186px]">
          Start a search by pressing Ctrl+K on your keyboard
        </Balancer>
      </Tooltip>
    </div>
  );
}
