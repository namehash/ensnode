import { describe, expect, expectTypeOf, it, vi } from "vitest";

import { createOmnigraphUrqlClient } from "../client";
import { graphql } from "../graphql";
import { localBigIntResolvers } from "./local-bigint-resolvers";

const mockFetch = vi.fn();
const client = createOmnigraphUrqlClient({ url: "http://whatever", fetch: mockFetch });

const BIGINT_VALUE = 1234567890n;
const BIGINT_STRING = BIGINT_VALUE.toString();

describe("localBigIntResolvers", () => {
  it("deserializes BigInt scalars as bigint", async () => {
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

  it("element-wise deserializes list-wrapped BigInt scalars", () => {
    // synthetic introspection with a [BigInt!]! field, since no current schema field is list-wrapped BigInt
    const schema = {
      __schema: {
        types: [
          {
            kind: "OBJECT",
            name: "Thing",
            fields: [
              {
                name: "values",
                type: {
                  kind: "NON_NULL",
                  ofType: {
                    kind: "LIST",
                    ofType: {
                      kind: "NON_NULL",
                      ofType: { kind: "SCALAR", name: "BigInt" },
                    },
                  },
                },
              },
            ],
          },
        ],
      },
    };

    const resolvers = localBigIntResolvers(schema);
    const resolver = resolvers.Thing!.values!;
    const result = resolver(
      { values: ["1", "2", "3"] },
      {},
      {} as never,
      { fieldName: "values" } as never,
    );
    expect(result).toEqual([1n, 2n, 3n]);
  });
});
