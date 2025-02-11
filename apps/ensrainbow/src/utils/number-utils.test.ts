import { describe, expect, test } from "vitest";
import { parseNonNegativeInteger } from "./number-utils.js";

describe("parseNonNegativeInteger", () => {
    test("valid non-negative integers", () => {
        expect(parseNonNegativeInteger("0")).toBe(0);
        expect(parseNonNegativeInteger("42")).toBe(42);
        expect(parseNonNegativeInteger("1000000")).toBe(1000000);
    });

    test("invalid inputs return null", () => {
        // Non-integer numbers
        expect(parseNonNegativeInteger("3.14")).toBeNull();
        expect(parseNonNegativeInteger("0.5")).toBeNull();

        // Negative numbers
        expect(parseNonNegativeInteger("-5")).toBeNull();
        expect(parseNonNegativeInteger("-0")).toBeNull();

        // Non-numeric strings
        expect(parseNonNegativeInteger("abc")).toBeNull();
        expect(parseNonNegativeInteger("")).toBeNull();
        expect(parseNonNegativeInteger(" ")).toBeNull();
        
        // Mixed content
        expect(parseNonNegativeInteger("42abc")).toBeNull();
        expect(parseNonNegativeInteger("abc42")).toBeNull();
    });
}); 
