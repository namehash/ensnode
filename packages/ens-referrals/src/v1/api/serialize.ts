import {
  serializeReferralProgramRulesPieSplit,
  serializeReferrerEditionMetricsRankedPieSplit,
  serializeReferrerEditionMetricsUnrankedPieSplit,
  serializeReferrerLeaderboardPagePieSplit,
} from "../award-models/pie-split/api/serialize";
import {
  serializeReferralProgramRulesRevShareLimit,
  serializeReferrerEditionMetricsRankedRevShareLimit,
  serializeReferrerEditionMetricsUnrankedRevShareLimit,
  serializeReferrerLeaderboardPageRevShareLimit,
} from "../award-models/rev-share-limit/api/serialize";
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

    default: {
      const _exhaustiveCheck: never = rules;
      throw new Error(
        `Unknown award model: ${(_exhaustiveCheck as ReferralProgramRules).awardModel}`,
      );
    }
  }
}

/**
 * Serializes a {@link ReferrerLeaderboardPage} object.
 */
function serializeReferrerLeaderboardPage(
  page: ReferrerLeaderboardPage,
): SerializedReferrerLeaderboardPage {
  switch (page.awardModel) {
    case ReferralProgramAwardModels.PieSplit:
      return serializeReferrerLeaderboardPagePieSplit(page);
    case ReferralProgramAwardModels.RevShareLimit:
      return serializeReferrerLeaderboardPageRevShareLimit(page);
    default: {
      const _exhaustiveCheck: never = page;
      throw new Error(
        `Unknown award model: ${(_exhaustiveCheck as ReferrerLeaderboardPage).awardModel}`,
      );
    }
  }
}

/**
 * Serializes a {@link ReferrerEditionMetricsRanked} object.
 */
function serializeReferrerEditionMetricsRanked(
  detail: ReferrerEditionMetricsRanked,
): SerializedReferrerEditionMetricsRanked {
  switch (detail.awardModel) {
    case ReferralProgramAwardModels.PieSplit:
      return serializeReferrerEditionMetricsRankedPieSplit(detail);
    case ReferralProgramAwardModels.RevShareLimit:
      return serializeReferrerEditionMetricsRankedRevShareLimit(detail);
    default: {
      const _exhaustiveCheck: never = detail;
      throw new Error(
        `Unknown award model: ${(_exhaustiveCheck as ReferrerEditionMetricsRanked).awardModel}`,
      );
    }
  }
}

/**
 * Serializes a {@link ReferrerEditionMetricsUnranked} object.
 */
function serializeReferrerEditionMetricsUnranked(
  detail: ReferrerEditionMetricsUnranked,
): SerializedReferrerEditionMetricsUnranked {
  switch (detail.awardModel) {
    case ReferralProgramAwardModels.PieSplit:
      return serializeReferrerEditionMetricsUnrankedPieSplit(detail);
    case ReferralProgramAwardModels.RevShareLimit:
      return serializeReferrerEditionMetricsUnrankedRevShareLimit(detail);
    default: {
      const _exhaustiveCheck: never = detail;
      throw new Error(
        `Unknown award model: ${(_exhaustiveCheck as ReferrerEditionMetricsUnranked).awardModel}`,
      );
    }
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
