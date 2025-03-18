import cc from "classcat";
import { LearnMoreButton } from "../atoms/LearnMoreButton.tsx";
import { GraphProtocolIcon } from "../atoms/icons/GraphProtocolIcon.tsx";
import { ENSLabsLogo } from "../atoms/logos/ENSLabsLogo.tsx";

export default function Appreciation() {
  const subsectionStyles =
    "h-fit lg:w-1/3 flex flex-col flex-nowrap items-center lg:items-start justify-start self-stretch";
  const textStyles = "text-lg leading-7 font-normal text-gray-500 text-center lg:text-left";
  const verticalDividerStyles = "hidden lg:block w-[1px] shrink-0 self-stretch bg-gray-200";
  const horizontalDividerStyles = "block lg:hidden h-[1px] shrink-0 self-stretch bg-gray-200";
  const smallerHeaderStyles = "text-black text-lg leading-6 font-semibold";
  const iconWrapperStyles =
    "w-[52px] h-[52px] flex flex-col justify-center items-center bg-white border border-gray-200 rounded-[40px]";

  return (
    <section className="w-full h-fit py-[60px] px-5 lg:py-[100px] lg:px-[112px] flex flex-col flex-nowrap justify-start items-center">
      <div className="w-full box-border flex flex-col lg:flex-row justify-center items-center gap-10 max-w-[1216px]">
        <div className={cc([subsectionStyles, "gap-4"])}>
          <p className="text-3xl leading-9 font-bold">💗</p>
          <h3 className="text-3xl leading-9 font-bold not-italic text-center lg:text-left">
            Some words of appreciation
          </h3>
          <p className={textStyles}>ENSRainbow builds on prior work from some amazing teams.</p>
        </div>
        <div className={verticalDividerStyles} />
        <div className={horizontalDividerStyles} />
        <div className={cc([subsectionStyles, "gap-6"])}>
          <div className={iconWrapperStyles}>
            <GraphProtocolIcon />
          </div>
          <h3 className={smallerHeaderStyles}>The Graph Protocol</h3>
          <p className={textStyles}>
            Created the original rainbow tables used in the ENS Subgraph.
          </p>
          <LearnMoreButton source="https://thegraph.com/" iconFillColor="black" text="Learn more" />
        </div>
        <div className={verticalDividerStyles} />
        <div className={horizontalDividerStyles} />
        <div className={cc([subsectionStyles, "gap-6"])}>
          <div className={iconWrapperStyles}>
            <ENSLabsLogo />
          </div>
          <h3 className={smallerHeaderStyles}>ENS Labs</h3>
          <p className={textStyles}>Developed and maintained the ENS Subgraph.</p>
          <LearnMoreButton
            source="https://www.enslabs.org/"
            iconFillColor="black"
            text="Learn more"
          />
        </div>
      </div>
    </section>
  );
}
