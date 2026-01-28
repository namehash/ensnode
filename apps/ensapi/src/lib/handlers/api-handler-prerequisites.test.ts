import { describe, expect, it, vi } from "vitest";

import {
  buildResultInsufficientIndexingProgress,
  buildResultInternalServerError,
  buildResultOkApiHandlerPrerequisitesValidation,
  buildResultServiceUnavailable,
  type ENSIndexerPublicConfig,
  ENSNamespaceIds,
  OmnichainIndexingStatusIds,
  PluginName,
} from "@ensnode/ensnode-sdk";

import type { EnsApiConfig } from "@/config/config.schema";

import { validateApiHandlerPrerequisites } from "./api-handler-prerequisites";
import { arrangeMockedIndexingStatusVar } from "./mocks";

vi.mock("@/config", () => ({
  get default() {
    const mockedConfig: Pick<
      EnsApiConfig,
      "ensIndexerUrl" | "namespace" | "ensIndexerPublicConfig"
    > = {
      ensIndexerUrl: new URL("https://ensnode.example.com"),
      namespace: ENSNamespaceIds.Mainnet,
      ensIndexerPublicConfig: {
        plugins: [PluginName.Subgraph, PluginName.Basenames, PluginName.Lineanames],
      } as ENSIndexerPublicConfig,
    };

    return mockedConfig;
  },
}));

describe("API Handler Prerequisites", () => {
  describe("validateApiHandlerPrerequisites", () => {
    it("should fail validation when indexing status middleware is missing", () => {
      // Arrange
      const indexingStatusVar = undefined;

      // Act
      const validationResult = validateApiHandlerPrerequisites(indexingStatusVar);

      // Assert
      expect(validationResult).toStrictEqual(
        buildResultInternalServerError(`Invariant: indexingStatusMiddleware required.`),
      );
    });
  });

  it("should fail validation when indexing status has not been fetched yet", () => {
    // Arrange
    const indexingStatusVar = new Error("Indexing status fetch failed");

    // Act
    const validationResult = validateApiHandlerPrerequisites(indexingStatusVar);

    // Assert
    expect(validationResult).toStrictEqual(
      buildResultServiceUnavailable(
        `This API is temporarily unavailable for this ENSNode instance. The indexing status has not been loaded by ENSApi yet.`,
      ),
    );
  });

  it("should fail validation when required plugins are not activated", () => {
    // Arrange
    const indexingStatusVar = arrangeMockedIndexingStatusVar({
      now: 1500,
      slowestChainIndexingCursor: 1490,
      omnichainStatus: OmnichainIndexingStatusIds.Following,
    });

    // Act
    const validationResult = validateApiHandlerPrerequisites(indexingStatusVar, [
      PluginName.Subgraph,
      PluginName.Basenames,
      PluginName.Lineanames,
      PluginName.Registrars,
    ]);

    // Assert
    expect(validationResult).toStrictEqual(
      buildResultServiceUnavailable(
        `This API is unavailable for this ENSNode instance. The connected ENSIndexer did not activate all the plugins this API requires. Active plugins: "subgraph, basenames, lineanames". Required plugins: "subgraph, basenames, lineanames, registrars".`,
        false,
      ),
    );
  });

  it("should fail validation when indexing progress is insufficient", () => {
    // Arrange
    const indexingStatusVar = arrangeMockedIndexingStatusVar({
      now: 1500,
      slowestChainIndexingCursor: 1490,
      omnichainStatus: OmnichainIndexingStatusIds.Backfill,
    });

    // Act
    const validationResult = validateApiHandlerPrerequisites(indexingStatusVar, [
      PluginName.Subgraph,
    ]);

    // Assert
    expect(validationResult).toStrictEqual(
      buildResultInsufficientIndexingProgress(
        `This API is temporarily unavailable for this ENSNode instance. The cached omnichain indexing status of the connected ENSIndexer has insufficient progress.`,
        {
          currentIndexingStatus: OmnichainIndexingStatusIds.Backfill,
          currentIndexingCursor: 1490,
          startIndexingCursor: 500,
          targetIndexingStatus: OmnichainIndexingStatusIds.Following,
          targetIndexingCursor: 1490,
        },
      ),
    );
  });

  it("should pass validation when no required plugins are specified", () => {
    // Arrange
    const indexingStatusVar = arrangeMockedIndexingStatusVar({
      now: 1500,
      slowestChainIndexingCursor: 1490,
      omnichainStatus: OmnichainIndexingStatusIds.Following,
    });

    // Act
    const validationResult = validateApiHandlerPrerequisites(indexingStatusVar, []);

    // Assert
    expect(validationResult).toStrictEqual(
      buildResultOkApiHandlerPrerequisitesValidation({
        indexingStatus: indexingStatusVar,
      }),
    );
  });

  it("should pass validation when all prerequisites are met", () => {
    // Arrange
    const indexingStatusVar = arrangeMockedIndexingStatusVar({
      now: 1500,
      slowestChainIndexingCursor: 1490,
      omnichainStatus: OmnichainIndexingStatusIds.Following,
    });

    // Act
    const validationResult = validateApiHandlerPrerequisites(indexingStatusVar, [
      PluginName.Subgraph,
      PluginName.Basenames,
      PluginName.Lineanames,
    ]);

    // Assert
    expect(validationResult).toStrictEqual(
      buildResultOkApiHandlerPrerequisitesValidation({
        indexingStatus: indexingStatusVar,
      }),
    );
  });
});
