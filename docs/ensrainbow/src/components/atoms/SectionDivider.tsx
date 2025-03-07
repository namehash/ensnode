import cc from "classcat";

export type SectionDividerProps = {
    additionalStyles?: string;
}

export function SectionDivider(props: SectionDividerProps) {
    return (
        <div className={cc(["flex items-center justify-center w-full h-fit", props.additionalStyles])}>
            <span className="bg-gray-200 h-[1px] w-full"></span>
        </div>
    );
}
