import { ENS_ECOSYSTEM_MEMBERS, type ENSEcosystemMemberDisplayData } from "./members-collection";
import { Tooltip } from "@namehash/namehash-ui/legacy";
import cc from "classcat";

export const ENSEcosystemMembers = () => {
  return (
    <section className="w-full h-fit box-border flex flex-col flex-nowrap justify-center items-center gap-5 sm:gap-10 px-5 py-7 sm:px-8 sm:pt-10 sm:pb-5 bg-[#011A25]">
      <p className="text-sm sm:text-base leading-6 font-normal text-white text-balance">
        Join the ENS ecosystem that builds on ENSNode
      </p>
      {Array.from(ENS_ECOSYSTEM_MEMBERS.entries()).map(([type, membersByType]) => (
        <div
          key={`ens-ecosystem-members-${type}`}
          className="max-w-[1216px] w-full h-fit flex flex-row flex-wrap justify-center items-center gap-6 gap-y-5 sm:gap-8 sm:gap-y-10 relative z-20"
        >
          {membersByType.map((member: ENSEcosystemMemberDisplayData) => (
            <Tooltip
              key={`tooltip-${member.name}`}
              sideOffset={-5}
              trigger={
                <a
                  key={`ens-ecosystem-member=${member.name}`}
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
      ))}
    </section>
  );
};
