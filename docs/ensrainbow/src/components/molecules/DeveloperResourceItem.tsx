import { RedirectIcon } from "../atoms/icons/RedirectIcon.tsx";
import { ListSectionElement } from "../../types/listSectionTypes";

type DeveloperResourceItemProps = {
    elem: ListSectionElement;
};

export const DeveloperResourceItem = ({ elem }: DeveloperResourceItemProps) => {
    const elementLink = elem.link;

    const content = (
        <div
            className={`group w-full md:w-[602px] h-full sm:min-w-[602px] max-w-[602px] box-border flex flex-row items-start justify-start bg-white p-5 gap-4 rounded-xl border border-gray-200
         ${elementLink && "hover:cursor-pointer hover:border-gray-300 hover:shadow-sm transition relative"}`}
        >
            {elementLink && (
                <RedirectIcon
                    className={`opacity-0 absolute z-10 top-[18px] right-[18px] transition-all duration-300 ${elementLink && "sm:group-hover:opacity-100"}`}
                />
            )}
            {elem.icon}
            <div>
                {elem.header}
                <p className="self-stretch not-italic z-10 text-gray-500 text-left text-sm leading-6 font-normal">
                    {elem.text}
                </p>
            </div>
        </div>
    );

    return elementLink == undefined ? (
        <div>{content}</div>
    ) : (
        <a
            href={elementLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group w-full sm:w-fit h-fit"
        >
            {content}
        </a>
    );
};
