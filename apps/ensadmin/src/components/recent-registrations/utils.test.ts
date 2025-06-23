import { describe, expect, it } from "vitest";
import {unixTimestampToDate} from "@/components/recent-registrations/utils";
describe("unixTimestampToDate", () => {
    it("should throw an exception for a non numerical input", () => {
        const invalidTimestamp = "A1781826068";

        expect(() => unixTimestampToDate(invalidTimestamp)).toThrowError(/Error parsing timestamp/);
    });

    it("should parse correct timestamp to a date object", () => {
        const validTimestamp = "1781826068";
        const expectedDate = new Date("2026-06-18T23:41:08.000Z");
        const result = unixTimestampToDate(validTimestamp);

        expect(result).toStrictEqual(expectedDate);
    });
});