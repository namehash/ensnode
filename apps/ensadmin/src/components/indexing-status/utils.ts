import { ChainIndexingPhaseViewModel, ChainStatusViewModel } from "./view-models";

/**
 * Calculate the position of a date in a timeline.
 *
 * @param date
 * @param timelineStart
 * @param timelineEnd
 * @returns
 */
export function getTimelinePosition(date: Date, timelineStart: Date, timelineEnd: Date): number {
  const start = timelineStart.getTime();
  const end = timelineEnd.getTime();
  const point = date.getTime();

  const percentage = ((point - start) / (end - start)) * 100;

  return Math.max(0, Math.min(100, percentage));
}

interface YearMarker {
  /** date of the marker */
  date: Date;

  /** position of the marker */
  position: number;

  /** label of the marker */
  label: string;
}

// Generate year markers for the timeline
export function generateYearMarkers(timelineStart: Date, timelineEnd: Date): Array<YearMarker> {
  const markers: Array<YearMarker> = [];

  const startYear = timelineStart.getFullYear();
  const endYear = timelineEnd.getFullYear();

  for (let year = startYear; year <= endYear; year++) {
    const date = new Date(year, 0, 1);
    if (date >= timelineStart && date <= timelineEnd) {
      markers.push({
        date,
        position: getTimelinePosition(date, timelineStart, timelineEnd),
        label: year.toString(),
      });
    }
  }

  return markers;
}

/**
 * Get the current phase of the chain indexing.
 * @param date current indexing date
 * @param chainStatus view model
 */
export function currentPhase(
  date: Date | null,
  chainStatus: ChainStatusViewModel,
): ChainIndexingPhaseViewModel {
  // if the chain is not indexed yet, return the first phase
  if (!date) {
    return chainStatus.phases[0];
  }

  for (let i = chainStatus.phases.length - 1; i >= 0; i--) {
    if (date >= chainStatus.phases[i].startDate) {
      return chainStatus.phases[i];
    }
  }

  return chainStatus.phases[0];
}
