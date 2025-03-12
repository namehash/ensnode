import cc from "classcat";

type ListBadgeProps = {
  text: string;
  width: number;
  height: number;
};

export function ListSectionBadge(props: ListBadgeProps) {
  const badgeStyle = cc([
    `w-[${props.width}px]`,
    `h-[${props.height}px]`,
    "flex justify-center items-center flex-shrink-0 py-[2px] px-[10px] bg-green-100 rounded-[10px] text-center text-green-800 text-xs leading-4 font-medium",
  ]);
  return <span className={badgeStyle}>{props.text}</span>;
}
