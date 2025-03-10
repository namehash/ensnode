import type {ImageCharacteristics} from "../../types/imageTypes.ts";
import cc from "classcat";


export type AboutRainbowProps = {
    sectionHeader: React.ReactNode;
    sectionDescription: React.ReactNode;
    descriptionExternalElems?: React.ReactNode
    sectionBackgroundName: string;
    isTextOnTheLeft: boolean;
    mobileImageOnTop: boolean;
    imageSpecifics: ImageCharacteristics;
    designatedMobileImage?: ImageCharacteristics;
    svgImage?: React.ReactNode;
};
export default function AboutRainbow(props: AboutRainbowProps) {
    return (
        <section
            className="box-border h-fit w-full flex flex-col xl:flex-row items-center justify-center gap-5 sm:gap-0 py-[60px] px-5 bg-white md:py-20 xl:px-28 xl:py-[120px]">
            {!props.isTextOnTheLeft && (
                <div
                    className={cc([
                        "relative hidden xl:flex flex-row justify-center items-center w-full max-w-2xl xl:w-1/2 rounded-none bg-origin-border flex-shrink-0 box-border pr-20",
                    ])}
                >
                    <div
                        className={cc([
                            "absolute z-0 h-[195%] w-full lg:w-[115%] bg-center bg-no-repeat bg-cover [opacity:0.3]",
                            props.sectionBackgroundName,
                        ])}
                    />
                    {props.svgImage ? props.svgImage :
                        <img
                            className={cc([
                                "relative z-10 w-[400%] h-[400%] sm:w-full sm:h-full",
                                props.imageSpecifics.styles,
                            ])}
                            src={props.imageSpecifics.source}
                            alt="chat image"
                            width={props.imageSpecifics.tagWidth}
                            height={props.imageSpecifics.tagHeight}
                        />
                    }
                </div>
            )}
            {props.mobileImageOnTop &&
                <div
                    className="flex sm:hidden flex-row justify-center items-center w-full h-fit rounded-none bg-origin-border bg-center bg-no-repeat bg-contain flex-shrink-0">
                    {props.svgImage ? props.svgImage :
                        (props.designatedMobileImage ?
                            <img
                                className={cc([
                                    "relative z-10 w-[400%] h-[400%] sm:w-full sm:h-full",
                                    props.designatedMobileImage.styles,
                                ])}
                                src={props.designatedMobileImage.source}
                                alt="chat image"
                                width={props.designatedMobileImage.tagWidth}
                                height={props.designatedMobileImage.tagHeight}
                            />
                            :
                            <img
                                className={cc([
                                    "relative z-10 w-[400%] h-[400%] sm:w-full sm:h-full",
                                    props.imageSpecifics.styles,
                                ])}
                                src={props.imageSpecifics.source}
                                alt="chat image"
                                width={props.imageSpecifics.tagWidth}
                                height={props.imageSpecifics.tagHeight}
                            />)
                    }
                </div>
            }
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
                {props.descriptionExternalElems && props.descriptionExternalElems}
            </div>

            <div
                className="relative hidden sm:flex flex-row justify-center items-center w-full h-2/3 xl:h-full xl:w-3/5 rounded-none bg-origin-border flex-shrink-0 ">
                {props.svgImage ? props.svgImage :
                    <img
                        className={cc([
                            "relative z-10 w-[400%] h-[400%] sm:w-full sm:h-full",
                            props.imageSpecifics.styles,
                        ])}
                        src={props.imageSpecifics.source}
                        alt="chat image"
                        width={props.imageSpecifics.tagWidth}
                        height={props.imageSpecifics.tagHeight}
                    />
                }
            </div>
            {!props.mobileImageOnTop &&
                <div
                    className="flex sm:hidden flex-row justify-center items-center w-full h-fit rounded-none py-5 bg-origin-border bg-center bg-no-repeat bg-contain flex-shrink-0">
                    {props.svgImage ? props.svgImage :
                        (props.designatedMobileImage ?
                            <img
                                className={cc([
                                    "relative z-10 w-[400%] h-[400%] sm:w-full sm:h-full",
                                    props.designatedMobileImage.styles,
                                ])}
                                src={props.designatedMobileImage.source}
                                alt="chat image"
                                width={props.designatedMobileImage.tagWidth}
                                height={props.designatedMobileImage.tagHeight}
                            />
                            :
                            <img
                                className={cc([
                                    "relative z-10 w-[400%] h-[400%] sm:w-full sm:h-full",
                                    props.imageSpecifics.styles,
                                ])}
                                src={props.imageSpecifics.source}
                                alt="chat image"
                                width={props.imageSpecifics.tagWidth}
                                height={props.imageSpecifics.tagHeight}
                            />)
                    }
                </div>
            }
        </section>
    );
}