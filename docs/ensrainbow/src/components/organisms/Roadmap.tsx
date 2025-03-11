import {CheckCircleIcon} from "@heroicons/react/24/solid";
import cc from "classcat";
import {RainbowIcon} from "../atoms/icons/RainbowIcon.tsx";
import {RocketIcon} from "../atoms/icons/RocketIcon.tsx";
import {Link} from "@namehash/namekit-react";

type RoadMapElement = {
    stageOfCompletion: "launched" | "in progress" | "planned";
    headerText: string;
    commentSentences: string[] | React.ReactNode[];
};

export default function RoadMap() {
    const classNames = (...classes: string[]) => {
        return classes.filter(Boolean).join(" ");
    };

    const launchedBadge = (
        <span
            className="relative inline-flex items-center justify-center rounded-[10px] sm:rounded-xl bg-black px-[10px] sm:px-3 py-0.5 text-center font-medium text-white not-italic text-xs leading-4 sm:text-sm sm:leading-5">
      Launched
    </span>
    );

    const inProgressBadge = (
        <span
            className="relative inline-flex w-fit h-auto items-center whitespace-nowrap justify-center rounded-[10px] sm:rounded-xl border border-black bg-white px-[10px] sm:px-3 py-0.5 text-center font-medium text-black not-italic text-xs leading-4 sm:text-sm sm:leading-5">
      In progress
    </span>
    );

    const plannedBadge = (
        <span
            className="relative inline-flex items-center justify-center rounded-[10px] sm:rounded-xl bg-[rgba(0,0,0,0.05)] px-[10px] sm:px-3 py-0.5 text-center font-medium text-black not-italic text-xs leading-4 sm:text-sm sm:leading-5">
      Planned
    </span>
    );

    const badgesMap = new Map<string, React.ReactNode>([
        ["launched", launchedBadge],
        ["in progress", inProgressBadge],
        ["planned", plannedBadge],
    ]);

    const roadMapElements: RoadMapElement[] = [
        {
            stageOfCompletion: "launched",
            headerText: "ENS Subgraph backwards compatibility",
            commentSentences: [
                "Support ENSNode achieving backwards compatibility with the ENS Subgraph."],
        },
        {
            stageOfCompletion: "launched",
            headerText: "Label Healing API",
            commentSentences: ["Implemented"],
        },
        {
            stageOfCompletion: "launched",
            headerText: "Client SDK",
            commentSentences: ["Implemented"],
        },
        {
            stageOfCompletion: "launched",
            headerText: "Devops Scripts",
            commentSentences: ["Implemented"],
        },
        {
            stageOfCompletion: "in progress",
            headerText: "Rainbow Table Versioning",
            commentSentences: [
                "Support backwards compatibility with the ENS Subgraph while significantly growing the set of healable labels.",
            ],
        },
        {
            stageOfCompletion: "in progress",
            headerText: "Rainbow Tables v2",
            commentSentences: [
                "Crack more than 100,000 otherwise unknown labels.",
            ],
        },
        {
            stageOfCompletion: "in progress",
            headerText: "Auto-heal revers lookup names",
            commentSentences: [
                <span key="AutoHealReverseLookupFragment">
          Description with a{" "}
                    <Link
                        href=""
                        target="_blank"
                        className="!text-black"
                        variant="underline"
                        size="small"
                    >
                        hyperlink
                    </Link>
        </span>,
            ],
        },
        {
            stageOfCompletion: "planned",
            headerText: "Bulk Label Healing API",
            commentSentences: [
                <span key="BulkLabelHealingFragment">
          Description with a{" "}
                    <Link
                        href=""
                        target="_blank"
                        className="!text-black"
                        variant="underline"
                        size="small"
                    >
                        hyperlink
                    </Link>
        </span>,
            ],
        },
        {
            stageOfCompletion: "planned",
            headerText: "Automated Unknown Label Cracking Service",
            commentSentences: [
                <span key="AutomatedLabelCrackingFragment">
          Description with a{" "}
                    <Link
                        href=""
                        target="_blank"
                        className="!text-black"
                        variant="underline"
                        size="small"
                    >
                        hyperlink
                    </Link>
        </span>,
            ],
        },
    ];

    const leftSideRainbows = [
        <RainbowIcon key="leftRainbow0"/>,
        <RainbowIcon key="leftRainbow1"/>,
        <RainbowIcon key="leftRainbow2"/>,
        <RainbowIcon key="leftRainbow3"/>,
        <RainbowIcon key="leftRainbow4"/>,
        <RainbowIcon key="leftRainbow5"/>,
        <RainbowIcon key="leftRainbow6"/>,
    ];
    const rightSideRainbows = [
        <RainbowIcon key="rightRainbow0"/>,
        <RainbowIcon key="rightRainbow1"/>,
        <RainbowIcon key="rightRainbow2"/>,
        <RainbowIcon key="rightRainbow3"/>,
        <RainbowIcon key="rightRainbow4"/>,
        <RainbowIcon key="rightRainbow5"/>,
        <RainbowIcon key="rightRainbow6"/>,
    ];

    return (
        <section
            className="bg-gradient-to-b to-white from-[#F9FAFB] w-full h-fit px-5 pt-[60px] pb-5 md:pt-24 md:pb-12 md:px-10 flex flex-row items-center justify-center z-10 gap-10">
            <div
                className="hidden w-1/5 h-full relative -top-20 md:flex flex-col justify-start items-center gap-[10.5rem]">
                {leftSideRainbows.map((rainbow, idx) => (
                    <div
                        key={`left-${idx}-Rainbow`}
                        className={cc([
                            "w-full h-full flex flex-row items-center",
                            idx % 2 === 1 ? "justify-start" : "justify-end"
                        ])}
                    >
                        <div
                            style={{
                                rotate: `-${90 * idx}deg`
                            }}
                            className="inline-flex items-start p-5 gap-[10px] border rounded-full border-gray-200 shadow-sm">
                            {rainbow}
                        </div>
                    </div>
                ))}
            </div>
            <div
                className="w-full sm:w-4/6 h-full flex flex-col items-center justify-center gap-8 sm:gap-20">
                <div className="inline-flex h-fit w-full flex-col items-center gap-5 sm:gap-2 z-10">
                    <div
                        className="inline-flex px-4 py-2 bg-[rgba(0,0,0,0.05)] rounded-3xl gap-2 justify-center items-center z-10">
                        <RocketIcon/>
                        <span className="text-black text-center text-sm leading-5 not-italic font-medium z-10">
                        Our future
                    </span>
                    </div>
                    <h1 className="text-black text-center not-italic font-bold text-2xl leading-8 sm:text-4xl sm:leading-[52px]">
                        ENSRainbow roadmap
                    </h1>
                    <p className="text-center text-gray-500 text-base leading-7 font-normal not-italic sm:text-base">
                        ENSRainbow aims to minimize unknown labels and make every ENS name known.
                    </p>
                </div>
                <div className="h-fit w-full max-w-[1050px]">
                    <ul role="list" className="space-y-4 w-full h-full flex-shrink-0">
                        {roadMapElements.map((roadmapElement, idx) => (
                            <li key={idx} className="relative flex gap-x-4">
                                <div
                                    className={classNames(
                                        idx === roadMapElements.length - 1 ? "h-4/5" : "h-full",
                                        "-bottom-6",
                                        "absolute left-0 top-0 flex w-6 justify-center mt-2",
                                    )}
                                >
                                    <div
                                        className={cc([
                                            "w-[2px] mt-5 mb-3",
                                            roadmapElement.stageOfCompletion === "launched"
                                                ? "bg-black"
                                                : "bg-gray-200",
                                        ])}
                                    />
                                </div>
                                <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                                    {roadmapElement.stageOfCompletion === "launched" ? (
                                        <CheckCircleIcon
                                            className="h-6 w-6 my-2 text-black"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <div
                                            className={cc([
                                                "h-2 w-2 rounded-full",
                                                roadmapElement.stageOfCompletion === "in progress"
                                                    ? "bg-black"
                                                    : "bg-gray-200",
                                            ])}
                                        />
                                    )}
                                </div>
                                <div className="w-full h-fit flex flex-col items-start gap-2 pb-6">
                                    <div
                                        className="relative -top-2 w-full h-fit inline-flex flex-row justify-between items-start self-stretch py-1.5">
                                        <h1 className="text-black text-lg leading-6 font-semibold not-italic pr-2">
                                            {roadmapElement.headerText}
                                        </h1>
                                        {badgesMap.get(roadmapElement.stageOfCompletion)}
                                    </div>
                                    <div
                                        className="relative -top-2 w-full h-fit flex flex-col items-start self-stretch rounded-lg border border-gray-200 bg-gray-50 p-5">
                                        <ul
                                            role="list"
                                            className="list-disc list-outside ml-[15px]"
                                        >
                                            {roadmapElement.commentSentences.map(
                                                (sentence, sentenceIdx) => (
                                                    <li
                                                        key={`${idx}${sentenceIdx}`}
                                                        className="box-border text-sm leading-6 text-gray-500 font-normal not-italic"
                                                    >
                                                        {sentence}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div
                className="hidden w-1/5 h-full relative -top-2 md:flex flex-col justify-center items-center gap-[10.5rem]">
                {rightSideRainbows.map((rainbow, idx) => (
                    <div
                        key={`left-${idx}-Rainbow`}
                        className={cc([
                            "w-full h-full flex flex-row items-center",
                            idx % 2 === 0 ? "justify-start" : "justify-end",
                        ])}
                    >
                        <div
                            style={{
                                rotate: `-${90 * (idx - 1)}deg`
                            }}
                            className="inline-flex items-start p-5 gap-[10px] border rounded-full border-gray-200 shadow-sm">
                            {rainbow}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
