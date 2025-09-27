import { UnixTimestamp } from "@ensnode/ensnode-sdk";
import { getUnixTime } from "date-fns";

/**
 * Calculate the position of a date in a timeline.
 *
 * @param requestedTimestamp
 * @param timelineStartsAt
 * @param timelineEndsAt
 * @returns
 */
export function getTimelinePosition(
  requestedTimestamp: UnixTimestamp,
  timelineStartsAt: UnixTimestamp,
  timelineEndsAt: UnixTimestamp,
): number {
  const percentage =
    ((requestedTimestamp - timelineStartsAt) / (timelineEndsAt - timelineStartsAt)) * 100;

  return Math.max(0, Math.min(100, percentage));
}

interface YearMarker {
  /** timestamp of the marker */
  timestamp: UnixTimestamp;

  /** position of the marker */
  position: number;

  /** label of the marker */
  label: string;
}

// Generate year markers for the timeline
export function generateYearMarkers(
  timelineStartsAt: UnixTimestamp,
  timelineEndsAt: UnixTimestamp,
): Array<YearMarker> {
  const markers: Array<YearMarker> = [];

  const startYear = new Date(timelineStartsAt).getFullYear();
  const endYear = new Date(timelineEndsAt).getFullYear();

  for (let year = startYear; year <= endYear; year++) {
    const yearStartsAt = getUnixTime(new Date(year, 0, 1));

    if (yearStartsAt >= timelineStartsAt && yearStartsAt <= timelineEndsAt) {
      markers.push({
        timestamp: yearStartsAt,
        position: getTimelinePosition(yearStartsAt, timelineStartsAt, timelineEndsAt),
        label: year.toString(),
      });
    }
  }

  return markers;
}
