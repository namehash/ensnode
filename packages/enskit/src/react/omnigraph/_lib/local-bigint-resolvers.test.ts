import { describe, expect, expectTypeOf, it, vi } from "vitest";

import { createOmnigraphUrqlClient } from "../client";
import { graphql } from "../graphql";

const mockFetch = vi.fn();
const client = createOmnigraphUrqlClient({ url: "http://whatever", fetch: mockFetch });

const BIGINT_VALUE = 1234567890n;
const BIGINT_STRING = BIGINT_VALUE.toString();

describe("localBigIntResolvers", () => {
  it("deserialized BigInt scalars as bigint", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            domain: {
              __typename: "ENSv1Domain",
              id: "test-domain-id",
              registration: {
                __typename: "BaseRegistrarRegistration",
                id: "test-registration-id",
                start: BIGINT_STRING,
              },
            },
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const { data } = await client.query(
      graphql(`
        query localBigIntResolvers {
          domain(by: { name: "example.eth" }) {
            id
            registration {
              id
              start
            }
          }
        }
      `),
      {},
    );

    expect(data!.domain!.registration!.start).toEqual(BIGINT_VALUE);
    expectTypeOf(data!.domain!.registration!.start).toEqualTypeOf<bigint>();
  });
});
