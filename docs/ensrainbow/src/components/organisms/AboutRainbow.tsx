import type {ImageCharacteristics} from "../../types/imageTypes.ts";
import cc from "classcat";


export type AboutRainbowProps = {
    sectionHeader: React.ReactNode;
    sectionDescription: React.ReactNode;
    sectionBackgroundName: string;
    isTextOnTheLeft: boolean;
    imageSpecifics: ImageCharacteristics;
};
export default function AboutRainbow(props: AboutRainbowProps) {
    return (
        <section className="w-full flex flex-col xl:flex-row items-center justify-center h-screen py-10 px-5 bg-white md:py-20">
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
                    <img
                        className={cc([
                            "relative z-10 w-full h-full",
                            props.imageSpecifics.styles,
                        ])}
                        src={props.imageSpecifics.source}
                        alt="chat image"
                        width={props.imageSpecifics.tagWidth}
                        height={props.imageSpecifics.tagHeight}
                        decoding="async"
                        loading="lazy"
                    />
                </div>
            )}
            <div
                className={cc([
                    "flex flex-col gap-5 h-fit w-full max-w-3xl items-center xl:items-start xl:w-1/2 md:px-[72px] xl:px-0",
                    props.isTextOnTheLeft ? "xl:pl-[72px]" : "xl:pr-[72px]",
                ])}
            >
                <h1 className="hidden sm:block text-black font-bold not-italic z-10 text-center xl:text-left text-4xl leading-10">
                    {props.sectionHeader}&nbsp;{" "}
                </h1>
                <div className="flex flex-col items-center gap-3 sm:hidden">
                    <h1 className="sm:hidden text-black font-bold not-italic z-10 text-center text-2xl leading-8">
                        {props.sectionHeader}
                    </h1>
                </div>
                <p className="text-gray-500 not-italic font-normal z-10 text-center text-lg leading-7 xl:text-left sm:text-lg sm:w-4/5 sm:leading-7 sm:font-light">
                    {props.sectionDescription}
                </p>
            </div>

            <div
                className={cc([
                    "relative hidden sm:flex flex-row justify-center items-center w-full max-w-2xl xl:w-1/2 rounded-none bg-origin-border flex-shrink-0 xl:right-[50px]",
                    !props.isTextOnTheLeft && "xl:hidden pt-8",
                ])}
            >
                <div
                    className={cc([
                        "absolute z-0 top-0 left-0 h-[105%] w-full lg:w-[110%] bg-center bg-no-repeat bg-cover [opacity:0.3]",
                        props.sectionBackgroundName,
                    ])}
                />
                <img
                    className={cc([
                        "relative z-10 w-full h-full",
                        props.imageSpecifics.styles,
                    ])}
                    src={props.imageSpecifics.source}
                    alt="chat image"
                    width={props.imageSpecifics.tagWidth}
                    height={props.imageSpecifics.tagHeight}
                    decoding="async"
                    loading="lazy"
                />
            </div>
            <div
                className="flex sm:hidden flex-row justify-center items-center w-full h-full rounded-none py-5 bg-origin-border bg-center bg-no-repeat bg-contain flex-shrink-0">
                <img
                    className={cc([
                        "relative z-10 w-full h-full",
                        props.imageSpecifics.styles,
                    ])}
                    src={props.imageSpecifics.source}
                    alt="chat image"
                    width={props.imageSpecifics.tagWidth}
                    height={props.imageSpecifics.tagHeight}
                    decoding="async"
                    loading="lazy"
                />
            </div>
        </section>
    );
}