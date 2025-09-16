"use client";

import mockDataJson from "@/app/mock/relative-time/data.json";
import {useMemo, useState} from "react";
import {RelativeTime, UnixTimestampInSeconds, unixTimestampToDate} from "@/components/datetime-utils";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {InfoIcon} from "@/components/icons/InfoIcon";
import {CheckIcon, X} from "lucide-react";

const mockRelativeTimestampData = mockDataJson as Record<string, UnixTimestampInSeconds>;
type TimeVariant = keyof typeof mockRelativeTimestampData;

const DEFAULT_VARIANT = "Past";

const relativeTimePropsDescriptions = new Map<boolean, Map<string, string>>([
    [true, new Map<string, string>([
        ["enforcePast", "Enforces that the return value won't relate to the future."],
        ["includeSeconds", "Includes seconds in the result"],
        ["conciseFormatting", "Removes special prefixes"]
    ])],
    [false, new Map<string, string>([
        ["enforcePast", "Return value might relate to the future"],
        ["includeSeconds", "Doesn't include seconds in the result"],
        ["conciseFormatting", "Includes special prefixes"]
    ])]
])

export default function MockRelativeTimePage() {
    const [selectedTime, setSelectedTime] = useState<TimeVariant>(DEFAULT_VARIANT);
    const variantProps: {
        date: Date;
        enforcePast?: boolean;
        includeSeconds?: boolean;
        conciseFormatting?: boolean;
        prefix?: string;
    }[] = useMemo(() => {
        const date = unixTimestampToDate(mockRelativeTimestampData[selectedTime]);

        return selectedTime === "Past" ?
                [
                    {
                        date: date,
                        includeSeconds: true,
                        conciseFormatting: true
                    },
                    {
                        date: date,
                        includeSeconds: true,
                        conciseFormatting: false
                    },
                    {
                        date: date,
                        includeSeconds: false,
                        conciseFormatting: true
                    },
                    {
                        date: date,
                        includeSeconds: false,
                        conciseFormatting: false
                    }
                ] : [
            {
                date: date,
                enforcePast: true
            },
            {
                date: date,
                enforcePast: false
            },
            {
                date: date,
                enforcePast: false,
                conciseFormatting: true
            }
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
            {variantProps.map((props, idx) =>
                <Card key={`mock-RelativeTime-variants-for-${selectedTime}-#${idx}`}>
                    <CardContent
                        className="max-sm:pt-3 pt-6 flex flex-row justify-start items-start gap-6 max-sm:gap-3">
                        <div className="flex flex-col justify-start items-start gap-2">
                            <p className="flex flex-row flex-nowrap justify-start items-center gap-1 text-md leading-normal font-semibold text-black">
                                Display Settings
                            </p>
                            {/*The checkValue logic is aligned with the RelativeTime optional props logic*/}
                            <RelativeTimePropCheck checkName="enforcePast" checkValue={props.enforcePast || false}/>
                            <RelativeTimePropCheck checkName="includeSeconds"
                                                   checkValue={props.includeSeconds || false}/>
                            <RelativeTimePropCheck checkName="conciseFormatting"
                                                   checkValue={props.conciseFormatting || false}/>
                        </div>
                        <div className="self-stretch w-[1px] bg-gray-300"/>
                        <div className="flex flex-col justify-start items-start gap-2">
                            <p className="flex flex-row flex-nowrap justify-start items-center gap-1 text-md leading-normal font-semibold text-black">
                                RelativeTimestamp
                            </p>
                            <RelativeTime {...props} />
                        </div>
                    </CardContent>
                </Card>
                )}
        </section>
    )
}

const RelativeTimePropCheck = ({
    checkName, checkValue
}: {
    checkName: string, checkValue
:
    boolean
}) => {
    const checksWrapperStyles = "flex flex-row flex-nowrap justify-start items-center gap-2";

    return (
        <div
            key={`RelativeTime-${checkName}-display-setting-check`}
            className="max-sm:w-full flex flex-row flex-nowrap justify-start max-sm:justify-between items-center gap-1"
        >
            <p className="text-sm leading-6 font-semibold text-gray-500">{checkName}</p>
            <div className={checksWrapperStyles}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {<InfoIcon className="flex-shrink-0"/>}
                    </TooltipTrigger>
                    <TooltipContent
                        side="top"
                        className="bg-gray-50 text-sm text-black shadow-md outline-none max-w-[275px]"
                    >
                        {
                            <p>
                                {relativeTimePropsDescriptions.get(checkValue)!.get(checkName)}
                            </p>
                        }
                    </TooltipContent>
                </Tooltip>
                {checkValue ? (
                    <CheckIcon className="text-emerald-600 flex-shrink-0"/>
                ) : (
                    <X className="text-red-600 flex-shrink-0"/>
                )}
            </div>
        </div>
    );
}