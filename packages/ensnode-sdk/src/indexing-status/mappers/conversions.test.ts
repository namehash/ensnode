import { describe, expect, it } from "vitest";
import { ENSNode } from "../../ensnode";
import { IndexingStatusDomain } from "../domain/types";
import { IndexingStatusDTO } from "../dto/types";
import { mapIndexingStatusDomainIntoDto } from "./domain-to-dto";
import { mapIndexingStatusDtoIntoDomain } from "./dto-to-domain";

describe("Indexing Status Conversions", () => {
  it("can turn Domain to DTO to JSON string to DTO to Domain", () => {
    // arrange: IndexingStatus Domain object
    const indexingStatusDomain: IndexingStatusDomain.IndexingStatus = new Map();

    const chainA = {
      chainId: 3,
      rpcHealth: ENSNode.RPCHealth.Unhealthy,
      indexingPhase: ENSNode.IndexingPhase.IndexingQueued,
      firstBlockToIndex: {
        number: 123,
        createdAt: new Date(),
      },
      lastIndexedBlock: null,
      lastSyncedBlock: {
        number: 456,
        createdAt: new Date(),
      },
      latestSafeBlock: null,
    } satisfies ENSNode.RpcUnhealthyAndIndexingQueued<IndexingStatusDomain.BlockInfo>;

    indexingStatusDomain.set(chainA.chainId, chainA);

    const chainB = {
      chainId: 6,
      rpcHealth: ENSNode.RPCHealth.Healthy,
      indexingPhase: ENSNode.IndexingPhase.IndexingStarted,
      firstBlockToIndex: {
        number: 123,
        createdAt: new Date(),
      },
      lastIndexedBlock: {
        number: 333,
        createdAt: new Date(),
      },
      lastSyncedBlock: {
        number: 456,
        createdAt: new Date(),
      },
      latestSafeBlock: {
        number: 789,
        createdAt: new Date(),
      },
    } satisfies ENSNode.RpcHealthyAndIndexingStarted<IndexingStatusDomain.BlockInfo>;

    indexingStatusDomain.set(chainB.chainId, chainB);

    const dto = mapIndexingStatusDomainIntoDto(indexingStatusDomain);

    // act
    const serializedDto = JSON.stringify(dto);
    const maybeDto = JSON.parse(serializedDto);
    const maybeDomain = mapIndexingStatusDtoIntoDomain(maybeDto);

    // assert
    expect(maybeDomain).toStrictEqual(indexingStatusDomain);
  });
});
