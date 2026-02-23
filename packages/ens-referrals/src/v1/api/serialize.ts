import {
  serializeReferralProgramRulesPieSplit,
  serializeReferrerEditionMetricsRankedPieSplit,
  serializeReferrerEditionMetricsUnrankedPieSplit,
  serializeReferrerLeaderboardPagePieSplit,
} from "../award-models/pie-split/api/serialize";
import type {
  ReferrerEditionMetricsRankedPieSplit,
  ReferrerEditionMetricsUnrankedPieSplit,
} from "../award-models/pie-split/edition-metrics";
import type { ReferrerLeaderboardPagePieSplit } from "../award-models/pie-split/leaderboard-page";
import {
  serializeReferralProgramRulesRevShareLimit,
  serializeReferrerEditionMetricsRankedRevShareLimit,
  serializeReferrerEditionMetricsUnrankedRevShareLimit,
  serializeReferrerLeaderboardPageRevShareLimit,
} from "../award-models/rev-share-limit/api/serialize";
import type {
  ReferrerEditionMetricsRankedRevShareLimit,
  ReferrerEditionMetricsUnrankedRevShareLimit,
} from "../award-models/rev-share-limit/edition-metrics";
import type { ReferrerLeaderboardPageRevShareLimit } from "../award-models/rev-share-limit/leaderboard-page";
import { ReferralProgramAwardModels } from "../award-models/shared/rules";
import type { ReferralProgramEditionConfig } from "../edition";
import type {
  ReferrerEditionMetrics,
  ReferrerEditionMetricsRanked,
  ReferrerEditionMetricsUnranked,
} from "../edition-metrics";
import type { ReferrerLeaderboardPage } from "../leaderboard-page";
import type { ReferralProgramRules } from "../rules";
import type {
  SerializedReferralProgramEditionConfig,
  SerializedReferralProgramEditionConfigSetResponse,
  SerializedReferralProgramRules,
  SerializedReferrerEditionMetrics,
  SerializedReferrerEditionMetricsRanked,
  SerializedReferrerEditionMetricsUnranked,
  SerializedReferrerLeaderboardPage,
  SerializedReferrerLeaderboardPageResponse,
  SerializedReferrerMetricsEditionsData,
  SerializedReferrerMetricsEditionsResponse,
} from "./serialized-types";
import {
  type ReferralProgramEditionConfigSetResponse,
  ReferralProgramEditionConfigSetResponseCodes,
  type ReferrerLeaderboardPageResponse,
  ReferrerLeaderboardPageResponseCodes,
  type ReferrerMetricsEditionsResponse,
  ReferrerMetricsEditionsResponseCodes,
} from "./types";

/**
 * Serializes a {@link ReferralProgramRules} object.
 */
export function serializeReferralProgramRules(
  rules: ReferralProgramRules,
): SerializedReferralProgramRules {
  switch (rules.awardModel) {
    case ReferralProgramAwardModels.PieSplit:
      return serializeReferralProgramRulesPieSplit(rules);

    case ReferralProgramAwardModels.RevShareLimit:
      return serializeReferralProgramRulesRevShareLimit(rules);
  }
}

/**
 * Serializes a {@link ReferrerLeaderboardPage} object.
 */
function serializeReferrerLeaderboardPage(
  page: ReferrerLeaderboardPage,
): SerializedReferrerLeaderboardPage {
  switch (page.rules.awardModel) {
    case ReferralProgramAwardModels.PieSplit:
      // Single type assertion per branch: rules.awardModel === "pie-split" guarantees all correlated
      // fields are the pie-split variant, but TypeScript cannot narrow a union on a nested property.
      return serializeReferrerLeaderboardPagePieSplit(page as ReferrerLeaderboardPagePieSplit);
    case ReferralProgramAwardModels.RevShareLimit:
      return serializeReferrerLeaderboardPageRevShareLimit(
        page as ReferrerLeaderboardPageRevShareLimit,
      );
  }
}

/**
 * Serializes a {@link ReferrerEditionMetricsRanked} object.
 */
function serializeReferrerEditionMetricsRanked(
  detail: ReferrerEditionMetricsRanked,
): SerializedReferrerEditionMetricsRanked {
  switch (detail.rules.awardModel) {
    case ReferralProgramAwardModels.PieSplit:
      return serializeReferrerEditionMetricsRankedPieSplit(
        detail as ReferrerEditionMetricsRankedPieSplit,
      );
    case ReferralProgramAwardModels.RevShareLimit:
      return serializeReferrerEditionMetricsRankedRevShareLimit(
        detail as ReferrerEditionMetricsRankedRevShareLimit,
      );
  }
}

/**
 * Serializes a {@link ReferrerEditionMetricsUnranked} object.
 */
function serializeReferrerEditionMetricsUnranked(
  detail: ReferrerEditionMetricsUnranked,
): SerializedReferrerEditionMetricsUnranked {
  switch (detail.rules.awardModel) {
    case ReferralProgramAwardModels.PieSplit:
      return serializeReferrerEditionMetricsUnrankedPieSplit(
        detail as ReferrerEditionMetricsUnrankedPieSplit,
      );
    case ReferralProgramAwardModels.RevShareLimit:
      return serializeReferrerEditionMetricsUnrankedRevShareLimit(
        detail as ReferrerEditionMetricsUnrankedRevShareLimit,
      );
  }
}

/**
 * Serializes a {@link ReferrerEditionMetrics} object (ranked or unranked).
 */
function serializeReferrerEditionMetrics(
  detail: ReferrerEditionMetrics,
): SerializedReferrerEditionMetrics {
  switch (detail.type) {
    case "ranked":
      return serializeReferrerEditionMetricsRanked(detail);
    case "unranked":
      return serializeReferrerEditionMetricsUnranked(detail);
    default: {
      const _exhaustiveCheck: never = detail;
      throw new Error(`Unknown detail type: ${(_exhaustiveCheck as ReferrerEditionMetrics).type}`);
    }
  }
}

/**
 * Serializes a {@link ReferralProgramEditionConfig} object.
 */
export function serializeReferralProgramEditionConfig(
  editionConfig: ReferralProgramEditionConfig,
): SerializedReferralProgramEditionConfig {
  return {
    slug: editionConfig.slug,
    displayName: editionConfig.displayName,
    rules: serializeReferralProgramRules(editionConfig.rules),
  };
}

/**
 * Serialize a {@link ReferrerLeaderboardPageResponse} object.
 */
export function serializeReferrerLeaderboardPageResponse(
  response: ReferrerLeaderboardPageResponse,
): SerializedReferrerLeaderboardPageResponse {
  switch (response.responseCode) {
    case ReferrerLeaderboardPageResponseCodes.Ok:
      return {
        responseCode: response.responseCode,
        data: serializeReferrerLeaderboardPage(response.data),
      };

    case ReferrerLeaderboardPageResponseCodes.Error:
      return response;
  }
}

/**
 * Serialize a {@link ReferrerMetricsEditionsResponse} object.
 */
export function serializeReferrerMetricsEditionsResponse(
  response: ReferrerMetricsEditionsResponse,
): SerializedReferrerMetricsEditionsResponse {
  switch (response.responseCode) {
    case ReferrerMetricsEditionsResponseCodes.Ok: {
      const serializedData = Object.fromEntries(
        Object.entries(response.data).map(([editionSlug, detail]) => [
          editionSlug,
          serializeReferrerEditionMetrics(detail as ReferrerEditionMetrics),
        ]),
      ) as SerializedReferrerMetricsEditionsData;

      return {
        responseCode: response.responseCode,
        data: serializedData,
      };
    }

    case ReferrerMetricsEditionsResponseCodes.Error:
      return response;

    default: {
      const _exhaustiveCheck: never = response;
      throw new Error(
        `Unknown response code: ${(_exhaustiveCheck as ReferrerMetricsEditionsResponse).responseCode}`,
      );
    }
  }
}

/**
 * Serialize a {@link ReferralProgramEditionConfigSetResponse} object.
 */
export function serializeReferralProgramEditionConfigSetResponse(
  response: ReferralProgramEditionConfigSetResponse,
): SerializedReferralProgramEditionConfigSetResponse {
  switch (response.responseCode) {
    case ReferralProgramEditionConfigSetResponseCodes.Ok:
      return {
        responseCode: response.responseCode,
        data: {
          editions: response.data.editions.map(serializeReferralProgramEditionConfig),
        },
      };

    case ReferralProgramEditionConfigSetResponseCodes.Error:
      return response;

    default: {
      const _exhaustiveCheck: never = response;
      throw new Error(
        `Unknown response code: ${(_exhaustiveCheck as ReferralProgramEditionConfigSetResponse).responseCode}`,
      );
    }
  }
}
