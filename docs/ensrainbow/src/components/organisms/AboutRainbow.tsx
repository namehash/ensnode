import cc from "classcat";
import type {ImageCharacteristics} from "../../types/imageTypes.ts";

export type AboutRainbowProps = {
    sectionHeader: React.ReactNode;
    sectionDescription: React.ReactNode;
    descriptionExternalElements?: React.ReactNode;
    sectionBackgroundName: string;
    isTextOnTheLeft: boolean;
    svgImage: React.ReactNode;
    normalImage?: ImageCharacteristics;
    designatedMobileImage?: React.ReactNode;
    mobileImageOnTop: boolean;
};
export default function AboutRainbow(props: AboutRainbowProps) {
    return (
        <section
            className="box-border h-fit w-full flex flex-col items-center justify-center py-[60px] px-5 bg-white md:py-20 xl:px-28 xl:py-[120px]">
            <div className="flex flex-col xl:flex-row items-center justify-center xl:justify-between gap-5 sm:gap-0 max-w-[1216px]">
                {!props.isTextOnTheLeft && (
                    <div
                        className={cc([
                            "relative hidden xl:flex flex-row justify-center items-center w-full max-w-2xl xl:w-1/2 rounded-none bg-origin-border flex-shrink-0 box-border pr-20",
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
                )}
                {props.mobileImageOnTop && (
                    <div
                        className="flex sm:hidden flex-row justify-center items-center w-full h-fit rounded-none bg-origin-border bg-center bg-no-repeat bg-contain flex-shrink-0">
                        {props.designatedMobileImage ? props.designatedMobileImage : props.svgImage}
                    </div>
                )}
                <div
                    className="flex flex-col gap-5 h-fit w-full max-w-3xl items-center xl:items-start xl:w-1/2 md:px-[72px] xl:px-0">
                    <h1 className="hidden sm:block text-black font-bold not-italic z-10 text-center xl:text-left text-4xl leading-10">
                        {props.sectionHeader}
                    </h1>
                    <div className="flex flex-col items-center gap-3 sm:hidden">
                        <h1 className="sm:hidden text-black font-bold not-italic z-10 text-center text-2xl leading-8">
                            {props.sectionHeader}
                        </h1>
                    </div>
                    <p className="text-gray-500 not-italic font-normal z-10 text-center text-lg leading-8 xl:text-left">
                        {props.sectionDescription}
                    </p>
                    {props.descriptionExternalElements && props.descriptionExternalElements}
                </div>

                <div
                    className="relative hidden sm:flex flex-row justify-center items-center w-full h-2/3 xl:h-full xl:w-3/5 rounded-none bg-origin-border flex-shrink-0">
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

                {!props.mobileImageOnTop && (
                    <div
                        className="flex sm:hidden flex-row justify-center items-center w-full h-fit rounded-none py-5 bg-origin-border bg-center bg-no-repeat bg-contain flex-shrink-0">
                        {props.designatedMobileImage ? props.designatedMobileImage : props.svgImage}
                    </div>
                )}
            </div>
        </section>
    );
}
