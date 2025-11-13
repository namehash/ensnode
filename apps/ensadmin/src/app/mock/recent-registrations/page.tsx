"use client";

import { InterpretedName, NamedRegistrarAction } from "@ensnode/ensnode-sdk";

import { DisplayRecentRegistrations } from "@/components/recent-registrations/display-recent-registrations";
import {
  RecentRegistrationsAvailable,
  RecentRegistrationsDisabled,
  RecentRegistrationsUnavailable,
  RecentRegistrationsUnresolved,
  ResolutionStatusIds,
} from "@/components/recent-registrations/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MockRegistrationsPage() {
  const title = "Recent registrations and renewals (mocked)";

  return (
    <section className="flex flex-col gap-6 p-6 max-sm:p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl leading-normal">Mock: RecentRegistrations</CardTitle>
          <CardDescription>Select a mock RecentRegistrations variant</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            {/* {variants.map((variant) => (
              <Button
                key={variant}
                variant={selectedVariant === variant ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedVariant(variant as RegistrationsVariant)}
              >
                {variant}
              </Button>
            ))} */}
          </div>
        </CardContent>
      </Card>

      <hr />

      <DisplayRecentRegistrations
        title={`Resolution Disabled: ${title}`}
        resolvedRecentRegistrations={
          {
            resolutionStatus: ResolutionStatusIds.Disabled,
          } satisfies RecentRegistrationsDisabled
        }
      />

      <hr />

      <DisplayRecentRegistrations
        title={`Resolution Unresolved: ${title}`}
        resolvedRecentRegistrations={
          {
            resolutionStatus: ResolutionStatusIds.Unresolved,
            placeholderCount: 7,
          } satisfies RecentRegistrationsUnresolved
        }
      />

      <hr />

      <DisplayRecentRegistrations
        title={`Resolution Unavailable: ${title}`}
        resolvedRecentRegistrations={
          {
            resolutionStatus: ResolutionStatusIds.Unavailable,
            reason:
              "Either ENSNode has not all required plugins active, or the cached Omnichain Indexing Status is not 'following' or 'completed'.",
          } satisfies RecentRegistrationsUnavailable
        }
      />

      <hr />

      <DisplayRecentRegistrations
        title={`Resolution Available: ${title}`}
        resolvedRecentRegistrations={
          {
            resolutionStatus: ResolutionStatusIds.Available,
            registrarActions: [
              {
                action: {
                  id: "176209761600000000111551110000000009545322000000000000006750000000000000067",
                  type: "registration",
                  incrementalDuration: 2419200,
                  registrant: "0x877dd7fa7a6813361de23552c12d25af4a89cda7",
                  registrationLifecycle: {
                    subregistry: {
                      subregistryId: {
                        chainId: 11155111,
                        address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
                      },
                      node: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
                    },
                    node: "0x5bcdea30f2d591f5357045b89d3470d4ba4da00fd344a32fe323ab6fa2c0f343",
                    expiresAt: 1764516816,
                  },
                  pricing: {
                    baseCost: {
                      currency: "ETH",
                      amount: 7671232876711824n,
                    },
                    premium: {
                      currency: "ETH",
                      amount: 0n,
                    },
                    total: {
                      currency: "ETH",
                      amount: 7671232876711824n,
                    },
                  },
                  referral: {
                    encodedReferrer:
                      "0x0000000000000000000000007bddd635be34bcf860d5f02ae53b16fcd17e8f6f",
                    decodedReferrer: "0x7bddd635be34bcf860d5f02ae53b16fcd17e8f6f",
                  },
                  block: {
                    number: 9545322,
                    timestamp: 1762097616,
                  },
                  transactionHash:
                    "0x8b3316e97a92ea0f676943a206ef1722b90b279c0a769456a89b2afe37f205fa",
                  eventIds: [
                    "176209761600000000111551110000000009545322000000000000006750000000000000067",
                    "176209761600000000111551110000000009545322000000000000006750000000000000071",
                  ],
                },
                name: "nh35.eth" as InterpretedName,
              } satisfies NamedRegistrarAction,
              {
                action: {
                  id: "176234701200000000111551110000000009566045000000000000014150000000000000198",
                  type: "registration",
                  incrementalDuration: 31536000,
                  registrant: "0x5505957ff5927f29eacabbbe8a304968bf2dc064",
                  registrationLifecycle: {
                    subregistry: {
                      subregistryId: {
                        chainId: 11155111,
                        address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
                      },
                      node: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
                    },
                    node: "0xf1c0e6aa95596e0199f3a6341cdbe055b64ba6041662465e577ed80c4dfac2af",
                    expiresAt: 1793883012,
                  },
                  pricing: {
                    baseCost: null,
                    premium: null,
                    total: null,
                  },
                  referral: {
                    encodedReferrer: null,
                    decodedReferrer: null,
                  },
                  block: {
                    number: 9566045,
                    timestamp: 1762347012,
                  },
                  transactionHash:
                    "0xa71cf08102ae1f634b22349dac8dc158fe96ae74008b5e24cfcda8587e056d53",
                  eventIds: [
                    "176234701200000000111551110000000009566045000000000000014150000000000000198",
                  ],
                },

                name: "[e4310bf4547cb18b16b5348881d24a66d61fa94a013e5636b730b86ee64a3923].eth" as InterpretedName,
              } satisfies NamedRegistrarAction,

              {
                action: {
                  id: "176305292400000000111551110000000009622628000000000000002750000000000000049",
                  type: "registration",
                  incrementalDuration: 31536000,
                  registrant: "0xf925f9aa4044fbdbaf427623b30240a88ce4f409",
                  registrationLifecycle: {
                    subregistry: {
                      subregistryId: {
                        chainId: 11155111,
                        address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
                      },
                      node: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
                    },
                    node: "0x9d5ea970c67219a0c594c0e95bbd51861c40d3383776edf17b7db4cbbd2ad6b9",
                    expiresAt: 1794588924,
                  },
                  pricing: {
                    baseCost: {
                      currency: "ETH",
                      amount: 3125000000003490n,
                    },
                    premium: {
                      currency: "ETH",
                      amount: 0n,
                    },
                    total: {
                      currency: "ETH",
                      amount: 3125000000003490n,
                    },
                  },
                  referral: {
                    encodedReferrer:
                      "0x0000000000000000000000000000000000000000000000000000000000000000",
                    decodedReferrer: "0x0000000000000000000000000000000000000000",
                  },
                  block: {
                    number: 9622628,
                    timestamp: 1763052924,
                  },
                  transactionHash:
                    "0xa93e18582be652506e24ff16c8cc2dca0377b907ca9aab9236d2eba0d3096cfb",
                  eventIds: [
                    "176305292400000000111551110000000009622628000000000000002750000000000000049",
                    "176305292400000000111551110000000009622628000000000000002750000000000000053",
                  ],
                },
                name: "sonu100.eth" as InterpretedName,
              },
            ],
          } satisfies RecentRegistrationsAvailable
        }
      />
    </section>
  );
}
