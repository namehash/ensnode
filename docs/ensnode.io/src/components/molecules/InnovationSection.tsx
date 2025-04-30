import type { ImageCharacteristics } from "@workspace/docs/ensrainbow.io/src/types/imageTypes.ts";
import cc from "classcat";
import { Balancer } from "react-wrap-balancer";

export type InnovationSectionProps = {
  sectionHeader: React.ReactNode;
  sectionDescription: React.ReactNode;
  badgeText: string;
  badgeIcon: React.ReactNode;
  descriptionExternalElements?: React.ReactNode;
  sectionBackground: string;
  isTextOnTheLeft: boolean;
  svgImage: React.ReactNode;
  normalImage?: ImageCharacteristics;
  designatedMobileImage?: React.ReactNode;
  mobileImageOnTop: boolean;
  imageOnBottomForColumnLayout: boolean;
};

type ImageDisplayStyles = {
  displayStyles: string;
};

const ImageSection = (props: InnovationSectionProps & ImageDisplayStyles) => (
  <div
    className={cc([
      "relative hidden flex-row justify-center items-center w-full h-2/3 xl:h-full min-[680px]:w-3/4 xl:w-1/2 rounded-none bg-origin-border flex-shrink-0 max-w-2xl",
      props.displayStyles,
    ])}
  >
    {props.normalImage ? (
      <img
        className={cc([
          "relative z-10 w-[400%] h-[400%] sm:w-full sm:h-full",
          props.normalImage.styles,
        ])}
        src={props.normalImage.source}
        alt="section image"
        width={props.normalImage.tagWidth}
        height={props.normalImage.tagHeight}
      />
    ) : (
      props.svgImage
    )}
  </div>
);

export default function InnovationSection(props: InnovationSectionProps) {
  return (
    <section
      className={cc([
        "box-border h-fit w-full flex flex-col items-center justify-center px-5 py-10 md:py-20 xl:px-28 xl:py-[120px]",
        props.sectionBackground,
      ])}
    >
      <div className="flex flex-col xl:flex-row items-center justify-center xl:justify-between gap-10 sm:gap-5 xl:gap-20 max-w-[1216px]">
        {!props.isTextOnTheLeft && (
          <ImageSection {...props} displayStyles="overflow-visible xl:flex" />
        )}
        {props.mobileImageOnTop && (
          <div className="flex sm:hidden flex-row justify-center items-center w-full h-fit rounded-none bg-origin-border bg-center bg-no-repeat bg-contain flex-shrink-0">
            {props.designatedMobileImage ? props.designatedMobileImage : props.svgImage}
          </div>
        )}
        <div className="flex flex-col gap-5 h-fit w-full max-w-3xl items-center xl:items-start xl:w-1/2 md:px-[72px] xl:px-0">
          <span className="w-fit flex flex-row flex-nowrap justify-center items-center gap-2 px-4 py-2 rounded-[20px] border-gray-300 border">
            {props.badgeIcon}
            <p className="text-sm leading-5 font-medium text-center xl:text-left text-black">
              {props.badgeText}
            </p>
          </span>
          <Balancer
            as="h1"
            className="text-black font-bold not-italic z-10 text-center xl:text-left text-2xl leading-8"
          >
            {props.sectionHeader}
          </Balancer>
          <Balancer
            as="p"
            className="text-gray-500 not-italic font-normal z-10 text-center text-lg leading-8 xl:text-left self-stretch"
          >
            {props.sectionDescription}
          </Balancer>
          {props.descriptionExternalElements && props.descriptionExternalElements}
        </div>
        {props.isTextOnTheLeft && <ImageSection {...props} displayStyles="sm:flex" />}
        {!props.isTextOnTheLeft && props.imageOnBottomForColumnLayout && (
          <div className="w-full h-auto max-xl:max-w-[620px] hidden sm:flex xl:hidden">
            {props.designatedMobileImage}
          </div>
        )}
        {!props.mobileImageOnTop && (
          <div className="flex sm:hidden flex-row justify-center items-center w-full h-fit rounded-none bg-origin-border bg-center bg-no-repeat bg-contain flex-shrink-0">
            {props.designatedMobileImage ? props.designatedMobileImage : props.svgImage}
          </div>
        )}
      </div>
    </section>
  );
}
