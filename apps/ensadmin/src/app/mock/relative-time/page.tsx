"use client";

import mockDataJson from "@/app/mock/relative-time/data.json";
import {
  AbsoluteTime,
  RelativeTime,
  UnixTimestampInSeconds,
  unixTimestampToDate,
} from "@/components/datetime-utils";
import { InfoIcon } from "@/components/icons/InfoIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type UnixTimestamp } from "@ensnode/ensnode-sdk";
import { CheckIcon, X as XIcon } from "lucide-react";
import { useMemo, useState } from "react";

const mockRelativeTimestampData = mockDataJson as Record<
  string,
  { date: UnixTimestampInSeconds; relativeTo?: UnixTimestampInSeconds }
>;
type TimeVariant = keyof typeof mockRelativeTimestampData;

const DEFAULT_VARIANT = "Past";

const relativeTimePropsDescriptions = new Map<boolean, Map<string, string>>([
  [
    true,
    new Map<string, string>([
      ["enforcePast", "Enforces that the return value won't relate to the future."],
      ["includeSeconds", "Includes seconds in the result"],
      ["conciseFormatting", "Removes special prefixes"],
    ]),
  ],
  [
    false,
    new Map<string, string>([
      ["enforcePast", "Return value might relate to the future"],
      ["includeSeconds", "Doesn't include seconds in the result"],
      ["conciseFormatting", "Includes special prefixes"],
    ]),
  ],
]);

export default function MockRelativeTimePage() {
  const [selectedTime, setSelectedTime] = useState<TimeVariant>(DEFAULT_VARIANT);
  const variantProps: {
    timestamp: UnixTimestamp;
    enforcePast: boolean;
    includeSeconds: boolean;
    conciseFormatting: boolean;
    relativeTo?: UnixTimestamp;
    prefix?: string;
  }[] = useMemo(() => {
    const timestamp = Number(mockRelativeTimestampData[selectedTime].date);
    // since the value is hardcoded we are sure it exists
    const relativeToForPast = Number(mockRelativeTimestampData["Past"].relativeTo!);

    return selectedTime === "Past"
      ? [
          {
            timestamp,
            includeSeconds: true,
            conciseFormatting: true,
            enforcePast: false,
            relativeTo: relativeToForPast,
          },
          {
            timestamp,
            includeSeconds: true,
            conciseFormatting: false,
            enforcePast: false,
            relativeTo: relativeToForPast,
          },
          {
            timestamp,
            includeSeconds: false,
            conciseFormatting: true,
            enforcePast: false,
            relativeTo: relativeToForPast,
          },
          {
            timestamp,
            includeSeconds: false,
            conciseFormatting: false,
            enforcePast: false,
            relativeTo: relativeToForPast,
          },
          {
            timestamp,
            includeSeconds: false,
            conciseFormatting: false,
            enforcePast: false,
          },
        ]
      : [
          {
            timestamp,
            includeSeconds: false,
            conciseFormatting: false,
            enforcePast: true,
          },
          {
            timestamp,
            includeSeconds: false,
            conciseFormatting: false,
            enforcePast: false,
          },
          {
            timestamp,
            includeSeconds: false,
            conciseFormatting: true,
            enforcePast: false,
          },
        ];
  }, [selectedTime]);

  return (
    <section className="flex flex-col gap-6 p-6 max-sm:p-4">
      <Card>
        <CardHeader>
          <CardTitle>Mock: RelativeTime</CardTitle>
          <CardDescription>Select a mock RelativeTime variant</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.keys(mockRelativeTimestampData).map((variant) => (
              <Button
                key={variant}
                variant={selectedTime === variant ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTime(variant as TimeVariant)}
              >
                {variant}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      {variantProps.map((props, idx) => (
        <Card key={`mock-RelativeTime-variants-for-${selectedTime}-#${idx}`}>
          <CardContent className="max-sm:pt-3 pt-6 flex flex-row justify-start items-start gap-6 max-sm:gap-3">
            <div className="flex flex-col justify-start items-start gap-2">
              <p className="flex flex-row flex-nowrap justify-start items-center gap-1 text-md leading-normal font-semibold text-black">
                Display Settings
              </p>
              {/*The checkValue logic is aligned with the RelativeTime optional props logic*/}
              <RelativeTimePropCheck checkName="enforcePast" checkValue={props.enforcePast} />
              <RelativeTimePropCheck checkName="includeSeconds" checkValue={props.includeSeconds} />
              <RelativeTimePropCheck
                checkName="conciseFormatting"
                checkValue={props.conciseFormatting}
              />
              <div className="h-[1px] self-stretch bg-gray-200" />
              <div
                key={`RelativeTime-relativeTo-display-setting-check`}
                className="max-sm:w-full flex flex-row flex-nowrap justify-start max-sm:justify-between items-center gap-1"
              >
                <p className="text-sm leading-6 font-semibold text-gray-500">date:</p>
                <p className="text-sm leading-6 font-semibold">
                  <AbsoluteTime
                    timestamp={props.timestamp}
                    options={{
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      second: "numeric",
                      hour12: true,
                    }}
                  />
                </p>
              </div>
              <div
                key={`RelativeTime-relativeTo-display-setting-check`}
                className="max-sm:w-full flex flex-row flex-nowrap justify-start max-sm:justify-between items-center gap-1"
              >
                <p className="text-sm leading-6 font-semibold text-gray-500">relativeTo:</p>
                <p className="text-sm leading-6 font-semibold">
                  {props.relativeTo ? (
                    <AbsoluteTime
                      timestamp={props.relativeTo}
                      options={{
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        second: "numeric",
                        hour12: true,
                      }}
                    />
                  ) : (
                    "Now"
                  )}
                </p>
              </div>
            </div>
            <div className="self-stretch w-[1px] bg-gray-300" />
            <div className="flex flex-col justify-start items-start gap-2">
              <p className="flex flex-row flex-nowrap justify-start items-center gap-1 text-md leading-normal font-semibold text-black">
                RelativeTimestamp
              </p>
              <RelativeTime {...props} tooltipPosition="right" />
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

const RelativeTimePropCheck = ({
  checkName,
  checkValue,
}: {
  checkName: string;
  checkValue: boolean;
}) => {
  const checksWrapperStyles = "flex flex-row flex-nowrap justify-start items-center gap-2";

  return (
    <div
      key={`RelativeTime-${checkName}-display-setting-check`}
      className="sm:min-w-[230px] max-sm:w-full flex flex-row flex-nowrap justify-start max-sm:justify-between items-center gap-1"
    >
      <p className="text-sm leading-6 font-semibold text-gray-500">{checkName}</p>
      <div className={checksWrapperStyles}>
        <Tooltip>
          <TooltipTrigger asChild>{<InfoIcon className="flex-shrink-0" />}</TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-gray-50 text-sm text-black shadow-md outline-none max-w-[275px]"
          >
            {<p>{relativeTimePropsDescriptions.get(checkValue)!.get(checkName)}</p>}
          </TooltipContent>
        </Tooltip>
        {checkValue ? (
          <CheckIcon className="text-emerald-600 flex-shrink-0" />
        ) : (
          <XIcon className="text-red-600 flex-shrink-0" />
        )}
      </div>
    </div>
  );
};
