import BarChart from "../molecules/BarChart.tsx";

export default function FullRainbow() {
  const sectionHeader = "Get the full rainbow";
  const sectionDescription =
    "Our goal is to heal as many ENS names as possible. The ENS community has better things to do than learn about technical complexities like unknown names or encoded labelhashes.";

  const badge = (text: string) => (
    <span className="relative inline-flex items-center justify-center rounded-[10px] sm:rounded-xl bg-black px-[10px] sm:px-3 py-0.5 text-center font-normal text-white not-italic text-xs leading-4">
      {text}
    </span>
  );

  const barChart = () => (
    <BarChart
      data={[
        {
          label: <>ENS Subgraph</>,
          value: 11,
          color: "linear-gradient(270deg, #DBE10B 0%, #FAE000 17.5%, #F09C0A 54.5%, #EA2F86 100%)",
        },
        {
          label: (
            <div className="flex flex-row flex-nowrap justify-start items-center gap-2">
              ENSRainbow + ENSNode {badge("Current")}
            </div>
          ),
          value: 94,
          color:
            "linear-gradient(270deg, #CA01FD -30.44%, #0B10FE -7.38%, #1EFDFF 16.33%, #93E223 38.07%, #FAE000 59.16%, #F09C0A 79.58%, #EA2F86 100%)",
        },
        {
          label: (
            <div className="flex flex-row flex-nowrap justify-start items-center gap-2">
              ENSRainbowBeam + ENSNode {badge("Target")}
            </div>
          ),
          value: 99,
          color:
            "linear-gradient(270deg, #CA01FD -0.46%, #0B10FE 17.29%, #1EFDFF 35.56%, #93E223 52.3%, #FAE000 68.54%, #F09C0A 84.27%, #EA2F86 100%)",
        },
      ]}
      title="Name Healing Coverage"
      footnote="Coverage vs. indexing the ENS Subgraph with no rainbow tables as of 26 May, 2026.&#10;Results exclude unnormalized names that are formatted as encoded labelhashes in the ENS Subgraph but are actually known."
    />
  );

  return (
    <section className="box-border w-full h-fit flex flex-col flex-nowrap items-center justify-center py-[60px] px-5 bg-[#FEFEFF] md:py-20 lg:px-28 lg:py-[120px]">
      <div className="flex flex-col xl:flex-row items-center justify-center gap-8 xl:justify-between max-w-[1216px]">
        <div className="relative flex flex-row justify-center lg:justify-start items-center w-full max-w-[640px] xl:w-[60%] rounded-none bg-origin-border shrink-0 box-border">
          {barChart()}
        </div>
        <div className="flex flex-col gap-4 h-fit w-full max-w-3xl items-center xl:items-start xl:w-[40%] md:px-[72px] xl:px-0">
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
      </div>
    </section>
  );
}
