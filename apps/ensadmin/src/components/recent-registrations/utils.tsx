import {useEffect, useState} from "react";
import {differenceInYears, formatDistanceToNow, intlFormat} from "date-fns";

// TODO: these functions could be moved to /components/ui and further refactored if deemed necessary.
//  Need to decide on their location

/**
 * Client-only date formatter component
 */
export function FormattedDate({
                                  date,
                                  options,
                              }: {
    date: Date;
    options: Intl.DateTimeFormatOptions;
}) {
    const [formattedDate, setFormattedDate] = useState<string>("");

    useEffect(() => {
        setFormattedDate(intlFormat(date, options));
    }, [date, options]);

    return <>{formattedDate}</>;
}

/**
 * Client-only relative time component
 */
export function RelativeTime({date}: {date: Date}) {
    const [relativeTime, setRelativeTime] = useState<string>("");

    useEffect(() => {
        setRelativeTime(formatDistanceToNow(date, { addSuffix: true }));
    }, [date]);

    return <>{relativeTime}</>;
}

/**
 * Helper function to calculate duration length in years or months
 */
const formatDuration = (beginsAt: Date, endsAt: Date) => {
        const years = differenceInYears(endsAt, beginsAt);

        // If less than a year, show months instead
        if (years === 0) {
            // Calculate months by getting the difference in milliseconds and converting to months
            const diffInMs = endsAt.getTime() - beginsAt.getTime();
            const months = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 30));

            //Generalize for really short duration
            if (months === 0){
                return 'less than a month';
            }
            return `${months} month${months !== 1 ? "s" : ""}`;
        }

        return `${years} year${years !== 1 ? "s" : ""}`;
};

/**
 * Client-only duration component
 */
export function Duration({
                      beginsAt,
                      endsAt,
                  }: {
    beginsAt: Date;
    endsAt: Date;
}) {
    const [duration, setDuration] = useState<string>("");

    useEffect(() => {
        setDuration(formatDuration(beginsAt, endsAt));
    }, [beginsAt, endsAt]);

    return <>{duration}</>;
}