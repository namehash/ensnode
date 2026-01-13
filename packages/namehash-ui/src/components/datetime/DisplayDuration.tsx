import { formatDistanceStrict, fromUnixTime } from "date-fns";
import { useEffect, useState } from "react";

import type { Duration } from "@ensnode/ensnode-sdk";

/**
 * Display Duration component
 */
export function DisplayDuration({ duration }: { duration: Duration }) {
  const [timeDistance, setTimeDistance] = useState<string>("");

  // formatDistanceStrict needs two UnixTimestamp values
  // so we create `beginsAt` and `endsAt` timestamps
  // where `beginsAt = endsAt - duration`
  const beginsAt = fromUnixTime(0);
  const endsAt = fromUnixTime(duration);

  useEffect(() => {
    setTimeDistance(formatDistanceStrict(beginsAt, endsAt));
  }, [beginsAt, endsAt]);

  return timeDistance;
}
