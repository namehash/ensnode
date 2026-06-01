import {
  FEATURED_ENSNODE_INTEGRATORS,
  type FeaturedENSNodeIntegratorsDisplayData,
} from "./integrators-collection";
import { Tooltip } from "@namehash/namehash-ui/legacy";
import cc from "classcat";

export const FeaturedENSNodeIntegrators = () => {
  // explicitly split the integrators into two rows for wide enough screens
  // to satisfy the request to put the ENSv2 Explorer app in the second row
  const splitIntegratorsAt = FEATURED_ENSNODE_INTEGRATORS.findIndex(
    (m) => m.name === "Official ENSv2 Explorer",
  );
  const [topIntegratorsRow, bottomIntegratorsRow] = [
    FEATURED_ENSNODE_INTEGRATORS.slice(0, splitIntegratorsAt),
    FEATURED_ENSNODE_INTEGRATORS.slice(splitIntegratorsAt),
  ];

  return (
    <section className="w-full h-fit box-border flex flex-col flex-nowrap justify-center items-center gap-5 sm:gap-10 px-5 py-7 sm:px-8 sm:py-10 bg-[#011A25]">
      <p className="text-sm sm:text-base leading-6 font-normal text-white text-balance">
        Join the ENS ecosystem that's already building on ENSNode
      </p>
      <DisplayENSNodeIntegrators
        integrators={FEATURED_ENSNODE_INTEGRATORS}
        className="flex min-[1270px]:hidden"
      />
      <DisplayENSNodeIntegrators
        integrators={topIntegratorsRow}
        className="hidden min-[1270px]:flex"
      />
      <DisplayENSNodeIntegrators
        integrators={bottomIntegratorsRow}
        className="hidden min-[1270px]:flex"
      />
    </section>
  );
};

const DisplayENSNodeIntegrators = ({
  integrators,
  className,
}: {
  integrators: FeaturedENSNodeIntegratorsDisplayData[];
  className?: string;
}) => (
  <div
    className={cc([
      "max-w-[1216px] w-full h-fit flex-row flex-wrap justify-center items-center gap-6 gap-y-5 sm:gap-8 sm:gap-y-10 relative z-20",
      className,
    ])}
  >
    {integrators.map((member: FeaturedENSNodeIntegratorsDisplayData) => (
      <Tooltip
        sideOffset={-5}
        trigger={
          <a
            key={`featured-ensnode-integrator=${member.name}`}
            aria-label={member.name}
            href={member.websiteURL.href}
            target="_blank"
            rel="noreferrer noopener"
            className="group w-fit h-fit flex justify-center items-center text-white/50 hover:text-white text-lg font-semibold cursor-pointer transition-colors duration-200"
          >
            <member.icon
              className={cc(["w-auto h-[25px] sm:h-[44px] shrink-0", member.customStyles])}
            />
          </a>
        }
      >
        {member.name}
      </Tooltip>
    ))}
  </div>
);
