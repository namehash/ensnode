export default function Counter() {
  const healedLabels = 258728012;
  const healedLabelsArray = Array.from(String(healedLabels), (num) => Number(num));
  const counterNumberStyles =
    "flex flex-col justify-center items-center w-6 sm:w-[52px] h-9 sm:h-[72px] rounded sm:rounded-lg border border-gray-200 text-lg sm:text-2xl leading-7 font-bold bg-white";

  return (
    <div className="relative bottom-10 box-border max-w-6xl mx-auto px-4 sm:px-0 pt-4 sm:pt-5 flex flex-col flex-nowrap justify-start items-center gap-4 sm:gap-5 sm:pb-10">
      <p className="text-center not-italic font-normal text-gray-500 text-lg leading-7">
        Placeholder
      </p>
      <div className="flex flex-nowrap flex-row justify-center items-center w-[fit-content] gap-1 sm:gap-3 max-w-[1216px]">
        {healedLabelsArray.map((elem, idx) => {
          if (
            (healedLabelsArray.length - (idx + 1)) % 3 === 0 &&
            idx !== healedLabelsArray.length - 1
          ) {
            return (
              <div
                key={`healedNameCounter${idx}`}
                className="flex flex-row flex-nowrap justify-center items-center gap-1 sm:gap-3"
              >
                <div className={counterNumberStyles}>{elem}</div>
                <b className="text-2xl leading-7 font-bold">,</b>
              </div>
            );
          } else {
            return (
              <div key={`healedNameCounter${idx}`} className={counterNumberStyles}>
                {elem}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
