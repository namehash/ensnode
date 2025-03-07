import {Button, Link} from "@namehash/namekit-react";
import {ExternalLinkIcon} from "./ExternalLinkIcon.tsx";
import cc from "classcat";

export type LearnMoreButtonProps = {
    text: string;
    source: string;
    iconFillColor?: string;
    styles?: string;
}

// export const LearnMoreButton = (props: LearnMoreButtonProps) => {
//     const baseStyles = "w-fit flex flex-nowrap flex-row justify-center items-center gap-3 bg-white rounded-lg border border-gray-300 pl-[17px] py-[9px] pr-[15px] shadow-sm hover:shadow-lg text-base leading-6 font-medium text-black";
//     return <button
//         className={props.styles ? cc([baseStyles, props.styles]) : baseStyles}>
//         <Link className="flex flex-row flex-nowrap items-center gap-3" href={props.source}>{props.text}<ExternalLinkIcon fillColor={props.iconFillColor ? props.iconFillColor : "#9CA3AF"}/></Link></button>
// }

export const LearnMoreButton = (props: LearnMoreButtonProps) => {
    return <Button
        variant="secondary"
        className="max-w-[100%] overflow-x-hidden"
        size="medium"
        asChild
    >
        <Link href={props.source}>
            {props.text}
            <Link.ExternalIcon/>
        </Link>
    </Button>
}