import cc from "classcat";
import BarChart from "../molecules/BarChart.tsx";

export default function FullRainbow() {
    const sectionHeader = "Get the full rainbow";
    const sectionDescription = "Our goal is to heal as many ENS names as possible. The ENS community has better things to do than learn about technical complexities like unknown names or encoded labelhashes.";

    const badge = (text: string) => <span
        className="relative inline-flex items-center justify-center rounded-[10px] sm:rounded-xl bg-black px-[10px] sm:px-3 py-0.5 text-center font-medium text-white not-italic text-xs leading-4 sm:text-sm sm:leading-5">
      {text}
    </span>;

    const barChart = () => <BarChart data={
        [
            {
                label: <>ENS Subgraph</>,
                value: 20,
                color: 'linear-gradient(270deg, #DBE10B 0%, #FAE000 17.5%, #F09C0A 54.5%, #EA2F86 100%)',
            },
            {
                label: <div className="flex flex-row flex-nowrap justify-start items-center gap-2">ENSRainbow +
                    ENSNode {badge('Current')}</div>,
                value: 62,
                color: 'linear-gradient(270deg, #CA01FD -30.44%, #0B10FE -7.38%, #1EFDFF 16.33%, #93E223 38.07%, #FAE000 59.16%, #F09C0A 79.58%, #EA2F86 100%)',
            },
            {
                label: <div className="flex flex-row flex-nowrap justify-start items-center gap-2">ENSRainbow +
                    ENSNode {badge('Future target')}</div>,
                value: 95,
                color: 'linear-gradient(270deg, #EA2F86 0%, #CA01FD 1%, #0B10FE 18.5%, #1EFDFF 36.5%, #93E223 53%, #FAE000 69%, #F09C0A 84.5%, #EA2F86 100%)',
            },
        ]
    }
                                     title="Name Healing Coverage"
                                     footnote="Coverage vs. indexing the ENS Subgraph with no rainbow tables as of 13 Feb, 2025."
    />;

    return (
        <section
            className="box-border w-full h-fit xl:h-full xl:max-h-screen flex flex-col xl:flex-row items-center justify-center gap-8 xl:gap-[120px] py-[60px] px-5 bg-[#FEFEFF] md:py-20 lg:px-28 lg:py-[120px]">
            <div
                className="relative flex flex-row justify-center items-center w-full max-w-2xl xl:w-[60%] rounded-none bg-origin-border flex-shrink-0 box-border">
                {barChart()}
            </div>
            <div
                className="flex flex-col gap-4 h-fit w-full max-w-3xl items-center xl:items-start xl:w-[40%] md:px-[72px] xl:px-0"
            >
                <h1 className="hidden sm:block text-black font-bold not-italic z-10 text-center xl:text-left text-4xl leading-10">
                    {sectionHeader}
                </h1>
                <div className="flex flex-col items-center gap-3 sm:hidden">
                    <h1 className="sm:hidden text-black font-bold not-italic z-10 text-center text-2xl leading-8">
                        {sectionHeader}
                    </h1>
                </div>
                <p className="text-gray-500 not-italic font-light z-10 text-center text-lg leading-7 xl:text-left sm:text-lg sm:leading-8 sm:font-normal">
                    {sectionDescription}
                </p>
            </div>
        </section>
    );
}