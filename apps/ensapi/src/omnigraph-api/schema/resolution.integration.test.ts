import { describe, expect, it } from "vitest";

import { accounts } from "@ensnode/datasources/devnet";

import { request } from "@/test/integration/graphql-utils";
import { gql } from "@/test/integration/omnigraph-api-client";

describe("Resolution Trace and Acceleration", () => {
  const DomainResolution = gql`
    query DomainResolution($name: InterpretedName!) {
      domain(by: { name: $name }) {
        resolve {
          trace
          acceleration {
            requested
            attempted
          }
          records {
            texts(keys: ["description"]) {
              key
              value
            }
          }
        }
      }
    }
  `;

  const AccountResolution = gql`
    query AccountResolution($address: Address!) {
      account(by: { address: $address }) {
        resolve {
          trace
          acceleration {
            requested
            attempted
          }
          primaryName(by: { coinType: 60 }) {
            name { interpreted }
            resolve {
              trace
              acceleration {
                requested
                attempted
              }
              records {
                addresses(coinTypes: [60]) {
                  coinType
                  address
                }
              }
            }
          }
        }
      }
    }
  `;

  it("returns trace and acceleration for Domain.resolve", async () => {
    const result = await request<any>(DomainResolution, { name: "example.eth" });
    const resolve = result.domain.resolve;

    expect(resolve.trace).toBeDefined();
    expect(Array.isArray(resolve.trace)).toBe(true);
    expect(resolve.trace.length).toBeGreaterThan(0);

    expect(resolve.acceleration).toEqual({
      requested: true,
      attempted: expect.any(Boolean),
    });

    expect(resolve.records.texts).toContainEqual({
      key: "description",
      value: "example.eth",
    });
  });

  it("returns trace and acceleration for Account.resolve and primaryName.resolve", async () => {
    const result = await request<any>(AccountResolution, { address: accounts.owner.address });
    const accountResolve = result.account.resolve;

    // Account.resolve.trace
    expect(accountResolve.trace).toBeDefined();
    expect(Array.isArray(accountResolve.trace)).toBe(true);
    expect(accountResolve.trace.length).toBeGreaterThan(0);

    // Account.resolve.acceleration
    expect(accountResolve.acceleration).toEqual({
      requested: true,
      attempted: expect.any(Boolean),
    });

    const primaryName = accountResolve.primaryName;
    expect(primaryName.name.interpreted).toBeDefined();

    // primaryName.resolve.trace
    expect(primaryName.resolve.trace).toBeDefined();
    expect(Array.isArray(primaryName.resolve.trace)).toBe(true);
    expect(primaryName.resolve.trace.length).toBeGreaterThan(0);

    // primaryName.resolve.acceleration
    expect(primaryName.resolve.acceleration).toEqual({
      requested: true,
      attempted: expect.any(Boolean),
    });

    expect(primaryName.resolve.records.addresses).toContainEqual({
      coinType: 60,
      address: accounts.owner.address,
    });
  });

  it("respects accelerate: false in Domain.resolve", async () => {
    const result = await request<any>(
      gql`
        query DomainNoAccelerate($name: InterpretedName!) {
          domain(by: { name: $name }) {
            resolve(accelerate: false) {
              acceleration {
                requested
                attempted
              }
            }
          }
        }
      `,
      { name: "example.eth" },
    );

    expect(result.domain.resolve.acceleration).toEqual({
      requested: false,
      attempted: false,
    });
  });

  it("respects accelerate: false in Account.resolve", async () => {
    const result = await request<any>(
      gql`
        query AccountNoAccelerate($address: Address!) {
          account(by: { address: $address }) {
            resolve(accelerate: false) {
              acceleration {
                requested
                attempted
              }
              primaryName(by: { coinType: 60 }) {
                resolve {
                  acceleration {
                    requested
                    attempted
                  }
                }
              }
            }
          }
        }
      `,
      { address: accounts.owner.address },
    );

    expect(result.account.resolve.acceleration).toEqual({
      requested: false,
      attempted: false,
    });

    // PrimaryNameResolve should inherit accelerate: false from Account.resolve
    expect(result.account.resolve.primaryName.resolve.acceleration).toEqual({
      requested: false,
      attempted: false,
    });
  });
});
