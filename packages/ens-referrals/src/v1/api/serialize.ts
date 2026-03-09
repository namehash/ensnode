import {
  serializeReferralProgramRulesPieSplit,
  serializeReferrerEditionMetricsPieSplit,
  serializeReferrerLeaderboardPagePieSplit,
} from "../award-models/pie-split/api/serialize";
import {
  serializeReferralProgramRulesRevShareLimit,
  serializeReferrerEditionMetricsRevShareLimit,
  serializeReferrerLeaderboardPageRevShareLimit,
} from "../award-models/rev-share-limit/api/serialize";
import type { ReferrerEditionMetricsUnrecognized } from "../award-models/shared/edition-metrics";
import type { ReferrerLeaderboardPageUnrecognized } from "../award-models/shared/leaderboard-page";
import type { ReferralProgramRulesUnrecognized } from "../award-models/shared/rules";
import { ReferralProgramAwardModels } from "../award-models/shared/rules";
import type { ReferralProgramEditionConfig } from "../edition";
import type { ReferrerEditionMetrics } from "../edition-metrics";
import type { ReferrerLeaderboardPage } from "../leaderboard-page";
import type { ReferralProgramRules } from "../rules";
import type {
  SerializedReferralProgramEditionConfig,
  SerializedReferralProgramEditionConfigSetResponse,
  SerializedReferralProgramRules,
  SerializedReferrerEditionMetrics,
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
 *
 * @throws if called with a {@link ReferralProgramRulesUnrecognized} — unrecognized editions are
 *   client-side forward-compatibility placeholders and must never be serialized.
 */
export function serializeReferralProgramRules(
  rules: ReferralProgramRules,
): SerializedReferralProgramRules {
  switch (rules.awardModel) {
    case ReferralProgramAwardModels.PieSplit:
      return serializeReferralProgramRulesPieSplit(rules);

    case ReferralProgramAwardModels.RevShareLimit:
      return serializeReferralProgramRulesRevShareLimit(rules);

    case ReferralProgramAwardModels.Unrecognized: {
      const unrecognized = rules as ReferralProgramRulesUnrecognized;
      throw new Error(
        `ReferralProgramRulesUnrecognized (originalAwardModel: '${unrecognized.originalAwardModel}') must not be serialized — it is a client-side forward-compatibility placeholder only.`,
      );
    }

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
 *
 * @throws if called with a {@link ReferrerLeaderboardPageUnrecognized} — unrecognized pages are
 *   client-side forward-compatibility placeholders and must never be serialized.
 */
function serializeReferrerLeaderboardPage(
  page: ReferrerLeaderboardPage,
): SerializedReferrerLeaderboardPage {
  switch (page.awardModel) {
    case ReferralProgramAwardModels.PieSplit:
      return serializeReferrerLeaderboardPagePieSplit(page);
    case ReferralProgramAwardModels.RevShareLimit:
      return serializeReferrerLeaderboardPageRevShareLimit(page);
    case ReferralProgramAwardModels.Unrecognized: {
      const unrecognized = page as ReferrerLeaderboardPageUnrecognized;
      throw new Error(
        `ReferrerLeaderboardPageUnrecognized (originalAwardModel: '${unrecognized.originalAwardModel}') must not be serialized — it is a client-side forward-compatibility placeholder only.`,
      );
    }
    default: {
      const _exhaustiveCheck: never = page;
      throw new Error(
        `Unknown award model: ${(_exhaustiveCheck as ReferrerLeaderboardPage).awardModel}`,
      );
    }
  }
}

/**
 * Serializes a {@link ReferrerEditionMetrics} object.
 *
 * @throws if called with a {@link ReferrerEditionMetricsUnrecognized} — unrecognized metrics are
 *   client-side forward-compatibility placeholders and must never be serialized.
 */
function serializeReferrerEditionMetrics(
  detail: ReferrerEditionMetrics,
): SerializedReferrerEditionMetrics {
  switch (detail.awardModel) {
    case ReferralProgramAwardModels.PieSplit:
      return serializeReferrerEditionMetricsPieSplit(detail);
    case ReferralProgramAwardModels.RevShareLimit:
      return serializeReferrerEditionMetricsRevShareLimit(detail);
    case ReferralProgramAwardModels.Unrecognized: {
      const unrecognized = detail as ReferrerEditionMetricsUnrecognized;
      throw new Error(
        `ReferrerEditionMetricsUnrecognized (originalAwardModel: '${unrecognized.originalAwardModel}') must not be serialized — it is a client-side forward-compatibility placeholder only.`,
      );
    }
    default: {
      const _exhaustiveCheck: never = detail;
      throw new Error(
        `Unknown award model: ${(_exhaustiveCheck as ReferrerEditionMetrics).awardModel}`,
      );
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
