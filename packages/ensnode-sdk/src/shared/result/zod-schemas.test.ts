import { describe, expect, it } from "vitest";

import {
  buildResultInsufficientIndexingProgress,
  OmnichainIndexingStatusIds,
  ResultCodes,
} from "../..";
import {
  makeAbstractResultErrorWithDataSchema,
  makeResultErrorInsufficientIndexingProgressDataSchema,
} from "./zod-schemas";

describe("Result Schemas", () => {
  describe("Error schema with data", () => {
    it("can build error schema including provided data schema", () => {
      const dataSchema = makeResultErrorInsufficientIndexingProgressDataSchema();

      const schema = makeAbstractResultErrorWithDataSchema(
        ResultCodes.InsufficientIndexingProgress,
        dataSchema,
      );

      const resultUnderTest = buildResultInsufficientIndexingProgress(
        "Request params are invalid",
        {
          currentIndexingCursor: 123,
          currentIndexingStatus: OmnichainIndexingStatusIds.Backfill,
          startIndexingCursor: 1,
          targetIndexingCursor: 150,
          targetIndexingStatus: OmnichainIndexingStatusIds.Following,
        },
      );

      const parsed = schema.safeParse(resultUnderTest);

      expect(parsed.data).toStrictEqual(resultUnderTest);
    });
  });
});
