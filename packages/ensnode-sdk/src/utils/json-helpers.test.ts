import { describe, expect, it } from "vitest";
import { jsonParseReviver, jsonStringifyReplacer } from "./json-helpers";

describe("json-helpers", () => {
  const testJsonStringWithDate = (date: Date) =>
    `{"valueNumber":5,"valueBigInt":"11n","valueDate":"${date.toISOString()}","arrayOfMixed":[6,"12n","${date.toISOString()}"]}`;

  describe("stringify", () => {
    it("can stringify JSON object with mixed data including dates, arrays and bigints", () => {
      const testObject = {
        fnArrow: () => console.log("test arrow function"),
        fnNamed() {
          console.log("test named function");
        },
        valueNumber: 5,
        valueBigInt: 11n,
        valueDate: new Date(),
        get arrayOfMixed() {
          return [6, 12n, testObject.valueDate];
        },
      };

      expect(JSON.stringify(testObject, jsonStringifyReplacer)).toStrictEqual(
        testJsonStringWithDate(testObject.valueDate),
      );
    });
  });

  describe("parse", () => {
    it("can parse JSON object including stringified dates, arrays and bigints", () => {
      const currentDate = new Date();
      const inputString = testJsonStringWithDate(currentDate);

      expect(JSON.parse(inputString, jsonParseReviver)).toStrictEqual({
        valueNumber: 5,
        valueBigInt: 11n,
        valueDate: currentDate,
        arrayOfMixed: [6, 12n, currentDate],
      });
    });
  });
});
