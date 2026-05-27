import { Fragment } from "react";

interface BarChartData {
  label: React.ReactNode;
  value: number;
  color: string;
}

interface BarChartProps {
  data: BarChartData[];
  title?: string;
  subtitle?: string;
  footnote?: string;
}

export default function BarChart({ data, title, subtitle, footnote }: BarChartProps) {
  const maxValue = 100;

  return (
    <div className="flex flex-col flex-nowrap gap-5">
      <div className="p-6 bg-[#F9FAFB] rounded-2xl flex flex-col flex-nowrap justify-start items-start gap-6">
        {title && <h2 className="text-lg md:text-2xl leading-8 font-semibold">{title}</h2>}
        {subtitle && <p style={{ color: "#666", marginBottom: "1.5rem" }}>{subtitle}</p>}

        <div className="w-full flex flex-col gap-4 md:gap-6">
          {data.map((item: BarChartData, index: number) => {
            const percent = (item.value / maxValue) * 100;
            const percentLabel = `${index === data.length - 1 ? "+" : ""}${percent}%`;

            return (
              <Fragment key={`barChartFragment#${index}`}>
                <div key={`barChartFull#${index}`} className="flex flex-col gap-2">
                  <span className="text-sm md:text-base leading-7 font-semibold">{item.label}</span>
                  <div key={`barChartBar#${index}`} className="flex items-center gap-3">
                    <div
                      className="relative h-7 flex-1 min-w-0 rounded-lg overflow-hidden"
                      style={{ backgroundColor: "#F0F0F0" }}
                    >
                      <div
                        key={`barChartRainbowBar#${index}`}
                        className="absolute inset-y-0 left-0 rounded-lg transition-[width] duration-500 ease-out"
                        style={{
                          width: `${percent}%`,
                          background: item.color,
                          backgroundSize: "cover",
                        }}
                      />
                    </div>
                    <span className="shrink-0 w-10 text-right text-xs leading-4 font-semibold tabular-nums">
                      {percentLabel}
                    </span>
                  </div>
                </div>
                {index < data.length - 1 && <div className="bg-gray-200 h-px self-stretch" />}
              </Fragment>
            );
          })}
        </div>
      </div>
      {footnote && <p className="text-sm leading-5 font-normal text-gray-500 px-4">{footnote}</p>}
    </div>
  );
}
