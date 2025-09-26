import { ResolverABI } from "@ensnode/datasources";
import { decodeEventLog } from "viem";
import { describe, expect, it } from "vitest";

describe("viem#decodeEventArgs", () => {
  it("should complain about mis-matched indexed args", () => {
    expect(() =>
      decodeEventLog({
        abi: ResolverABI,
        eventName: "TextChanged",
        // topics/data from https://etherscan.io/tx/0x1c852ec21dc816060052a2320e16116aac645b41b5321afd4f9992178947ba5d#eventlog
        topics: [
          "0xd8c9334b1a9c2f9da342a0a2b32629c1a229b6445dad78947f674b44444a7550",
          "0x4aeacf8a996820a6609013324038be7f8d07ff9185f50063e7bf81915e6d2c08",
        ],
        data: "0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000375726c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000375726c0000000000000000000000000000000000000000000000000000000000",
        strict: true, // strict is default, but we specify here for clarity
      }),
    ).toThrow(/Expected a topic for indexed event parameter/);
  });
});
