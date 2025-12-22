import type { ReferrerLeaderboard, ReferrerMetrics } from "@namehash/ens-referrals";

import {
  ReferrerLeaderboardPageResponseCodes,
  type ReferrerLeaderboardPageResponseOk,
} from "@ensnode/ensnode-sdk";

export const dbResultsReferrerLeaderboard: ReferrerMetrics[] = [
  {
    referrer: "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e",
    totalReferrals: 3,
    totalIncrementalDuration: 94694400,
    totalRevenueContribution: 15_000_000_000_000_000n, // 0.015 ETH
  },
  {
    referrer: "0xcfa4f8192ad39d1ee09f473e88e79d267e09ddca",
    totalReferrals: 2,
    totalIncrementalDuration: 63072000,
    totalRevenueContribution: 10_000_000_000_000_000n, // 0.01 ETH
  },
  {
    referrer: "0x00000000000000000000000000000000000000f1",
    totalReferrals: 3,
    totalIncrementalDuration: 39657600,
    totalRevenueContribution: 12_000_000_000_000_000n, // 0.012 ETH
  },
  {
    referrer: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    totalReferrals: 4,
    totalIncrementalDuration: 34214400,
    totalRevenueContribution: 18_000_000_000_000_000n, // 0.018 ETH
  },
  {
    referrer: "0xabe3fdb4d2cd5f2e7193a4ac380ecb68e899896a",
    totalReferrals: 7,
    totalIncrementalDuration: 15120000,
    totalRevenueContribution: 21_000_000_000_000_000n, // 0.021 ETH
  },
  {
    referrer: "0xffa596cdf9a69676e689b1a92e5e681711227d75",
    totalReferrals: 5,
    totalIncrementalDuration: 12960000,
    totalRevenueContribution: 16_000_000_000_000_000n, // 0.016 ETH
  },
  {
    referrer: "0x2a614b7984854177d22fa23a4034a13ea82e4f97",
    totalReferrals: 5,
    totalIncrementalDuration: 12096000,
    totalRevenueContribution: 14_000_000_000_000_000n, // 0.014 ETH
  },
  {
    referrer: "0x2382a5878a44a6de5c3d91537d4132dc29e93c60",
    totalReferrals: 4,
    totalIncrementalDuration: 9676800,
    totalRevenueContribution: 13_000_000_000_000_000n, // 0.013 ETH
  },
  {
    referrer: "0x0000ffa596cdf9a69676e689b1a92e5e68171122",
    totalReferrals: 1,
    totalIncrementalDuration: 7948800,
    totalRevenueContribution: 5_000_000_000_000_000n, // 0.005 ETH
  },
  {
    referrer: "0xc7190732aa0c3d523d945530bec6caeb8489b4a5",
    totalReferrals: 3,
    totalIncrementalDuration: 7257600,
    totalRevenueContribution: 9_000_000_000_000_000n, // 0.009 ETH
  },
  {
    referrer: "0x98c54f630c38c434cff2a1e3be9e095977cdc6af",
    totalReferrals: 3,
    totalIncrementalDuration: 7257600,
    totalRevenueContribution: 9_500_000_000_000_000n, // 0.0095 ETH
  },
  {
    referrer: "0x32eccaf03d59d87c8a164cffea7cb0c4b3b9d481",
    totalReferrals: 2,
    totalIncrementalDuration: 4838400,
    totalRevenueContribution: 6_000_000_000_000_000n, // 0.006 ETH
  },
  {
    referrer: "0x58879236e40b73482f585a5f74766d6b99cb1057",
    totalReferrals: 2,
    totalIncrementalDuration: 4838400,
    totalRevenueContribution: 7_000_000_000_000_000n, // 0.007 ETH
  },
  {
    referrer: "0x71afe4867bef795a686d13f4dc60bc8d3a4e70f6",
    totalReferrals: 2,
    totalIncrementalDuration: 4838400,
    totalRevenueContribution: 6_500_000_000_000_000n, // 0.0065 ETH
  },
  {
    referrer: "0x7e5d0cdd8144d0ec6ef7140e65714c011d462dbf",
    totalReferrals: 2,
    totalIncrementalDuration: 4838400,
    totalRevenueContribution: 7_500_000_000_000_000n, // 0.0075 ETH
  },
  {
    referrer: "0xadc318567a4a16db3839208b435184ae86ba3e43",
    totalReferrals: 2,
    totalIncrementalDuration: 4838400,
    totalRevenueContribution: 8_000_000_000_000_000n, // 0.008 ETH
  },
  {
    referrer: "0x2254f9bab9b3d56994504c46932289447a708529",
    totalReferrals: 2,
    totalIncrementalDuration: 4838400,
    totalRevenueContribution: 8_500_000_000_000_000n, // 0.0085 ETH
  },
  {
    referrer: "0xce5ecf6d9e2181ad77b53305e2b1b6eca54728f0",
    totalReferrals: 1,
    totalIncrementalDuration: 3628800,
    totalRevenueContribution: 4_000_000_000_000_000n, // 0.004 ETH
  },
  {
    referrer: "0x8354d821a89cc3c37902b60e9f30a15a6f810096",
    totalReferrals: 2,
    totalIncrementalDuration: 2505600,
    totalRevenueContribution: 5_500_000_000_000_000n, // 0.0055 ETH
  },
  {
    referrer: "0x7bddd635be34bcf860d5f02ae53b16fcd17e8f6f",
    totalReferrals: 3,
    totalIncrementalDuration: 2419203,
    totalRevenueContribution: 11_000_000_000_000_000n, // 0.011 ETH
  },
  {
    referrer: "0x3d93f8a930023263c17a639580525a561072458c",
    totalReferrals: 1,
    totalIncrementalDuration: 2419200,
    totalRevenueContribution: 3_000_000_000_000_000n, // 0.003 ETH
  },
  {
    referrer: "0x1779c4ad42cd07e437b6c6444b539ea1734fcaf4",
    totalReferrals: 1,
    totalIncrementalDuration: 2419200,
    totalRevenueContribution: 3_500_000_000_000_000n, // 0.0035 ETH
  },
  {
    referrer: "0xe45fb62899ccc74449923c7b34a91d7b9ee27d9f",
    totalReferrals: 1,
    totalIncrementalDuration: 2419200,
    totalRevenueContribution: 3_200_000_000_000_000n, // 0.0032 ETH
  },
  {
    referrer: "0xf35d9e265d20096af90a891205020ffab9291c8b",
    totalReferrals: 1,
    totalIncrementalDuration: 2419200,
    totalRevenueContribution: 4_500_000_000_000_000n, // 0.0045 ETH
  },
  {
    referrer: "0x9b86be6324d8d56247c04b2ec7ea4d0149fb1f64",
    totalReferrals: 1,
    totalIncrementalDuration: 2419200,
    totalRevenueContribution: 2_800_000_000_000_000n, // 0.0028 ETH
  },
  {
    referrer: "0xf5746ef53ed961afd3b2a6c6d13de65e1605d215",
    totalReferrals: 1,
    totalIncrementalDuration: 2419200,
    totalRevenueContribution: 2_500_000_000_000_000n, // 0.0025 ETH
  },
  {
    referrer: "0x531a360408b69dcf325115921064c6e784cdc297",
    totalReferrals: 1,
    totalIncrementalDuration: 2419200,
    totalRevenueContribution: 3_300_000_000_000_000n, // 0.0033 ETH
  },
];

export const emptyReferralLeaderboard: ReferrerLeaderboard = {
  rules: {
    totalAwardPoolValue: 10000,
    maxQualifiedReferrers: 10,
    startTime: 1735689600,
    endTime: 1767225599,
    subregistryId: {
      chainId: 1,
      address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    },
  },
  aggregatedMetrics: {
    grandTotalReferrals: 0,
    grandTotalIncrementalDuration: 0,
    grandTotalRevenueContribution: 0n,
    grandTotalQualifiedReferrersFinalScore: 0,
    minFinalScoreToQualify: 0,
  },
  referrers: new Map(),
  accurateAsOf: 1735689600,
};

export const populatedReferrerLeaderboard: ReferrerLeaderboard = {
  rules: {
    totalAwardPoolValue: 10000,
    maxQualifiedReferrers: 10,
    startTime: 1735689600,
    endTime: 1767225599,
    subregistryId: {
      chainId: 1,
      address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    },
  },
  aggregatedMetrics: {
    grandTotalReferrals: 68,
    grandTotalIncrementalDuration: 367027203,
    grandTotalRevenueContribution: 235_000_000_000_000_000n, // 0.235 ETH
    grandTotalQualifiedReferrersFinalScore: 16.55216891669386,
    minFinalScoreToQualify: 0,
  },
  referrers: new Map([
    [
      "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e",
      {
        referrer: "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e",
        totalReferrals: 3,
        totalIncrementalDuration: 94694400,
        totalRevenueContribution: 15_000_000_000_000_000n, // 0.015 ETH
        score: 3.0007460796594043,
        rank: 1,
        isQualified: true,
        finalScoreBoost: 1,
        finalScore: 6.001492159318809,
        awardPoolShare: 0.36258040801323277,
        awardPoolApproxValue: 3625.8040801323277,
      },
    ],
    [
      "0xcfa4f8192ad39d1ee09f473e88e79d267e09ddca",
      {
        referrer: "0xcfa4f8192ad39d1ee09f473e88e79d267e09ddca",
        totalReferrals: 2,
        totalIncrementalDuration: 63072000,
        totalRevenueContribution: 10_000_000_000_000_000n, // 0.01 ETH
        score: 1.9986721151016105,
        rank: 2,
        isQualified: true,
        finalScoreBoost: 0.8888888888888888,
        finalScore: 3.7752695507474865,
        awardPoolShare: 0.22808307296452854,
        awardPoolApproxValue: 2280.8307296452854,
      },
    ],
    [
      "0x00000000000000000000000000000000000000f1",
      {
        referrer: "0x00000000000000000000000000000000000000f1",
        totalReferrals: 3,
        totalIncrementalDuration: 39657600,
        totalRevenueContribution: 12_000_000_000_000_000n, // 0.012 ETH
        score: 1.256699316207725,
        rank: 3,
        isQualified: true,
        finalScoreBoost: 0.7777777777777778,
        finalScore: 2.234132117702622,
        awardPoolShare: 0.1349751883844881,
        awardPoolApproxValue: 1349.7518838448811,
      },
    ],
    [
      "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
      {
        referrer: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        totalReferrals: 4,
        totalIncrementalDuration: 34214400,
        totalRevenueContribution: 18_000_000_000_000_000n, // 0.018 ETH
        score: 1.084211174767449,
        rank: 4,
        isQualified: true,
        finalScoreBoost: 0.6666666666666667,
        finalScore: 1.8070186246124151,
        awardPoolShare: 0.10917110825215952,
        awardPoolApproxValue: 1091.7110825215952,
      },
    ],
    [
      "0xabe3fdb4d2cd5f2e7193a4ac380ecb68e899896a",
      {
        referrer: "0xabe3fdb4d2cd5f2e7193a4ac380ecb68e899896a",
        totalReferrals: 7,
        totalIncrementalDuration: 15120000,
        totalRevenueContribution: 21_000_000_000_000_000n, // 0.021 ETH
        score: 0.47913372622298883,
        rank: 5,
        isQualified: true,
        finalScoreBoost: 0.5555555555555556,
        finalScore: 0.7453191296802049,
        awardPoolShare: 0.04502848741040249,
        awardPoolApproxValue: 450.2848741040249,
      },
    ],
    [
      "0xffa596cdf9a69676e689b1a92e5e681711227d75",
      {
        referrer: "0xffa596cdf9a69676e689b1a92e5e681711227d75",
        totalReferrals: 5,
        totalIncrementalDuration: 12960000,
        totalRevenueContribution: 16_000_000_000_000_000n, // 0.016 ETH
        score: 0.41068605104827616,
        rank: 6,
        isQualified: true,
        finalScoreBoost: 0.4444444444444444,
        finalScore: 0.59321318484751,
        awardPoolShare: 0.035839000183789736,
        awardPoolApproxValue: 358.3900018378974,
      },
    ],
    [
      "0x2a614b7984854177d22fa23a4034a13ea82e4f97",
      {
        referrer: "0x2a614b7984854177d22fa23a4034a13ea82e4f97",
        totalReferrals: 5,
        totalIncrementalDuration: 12096000,
        totalRevenueContribution: 14_000_000_000_000_000n, // 0.014 ETH
        score: 0.38330698097839105,
        rank: 7,
        isQualified: true,
        finalScoreBoost: 0.33333333333333337,
        finalScore: 0.5110759746378548,
        awardPoolShare: 0.030876677081418856,
        awardPoolApproxValue: 308.76677081418853,
      },
    ],
    [
      "0x2382a5878a44a6de5c3d91537d4132dc29e93c60",
      {
        referrer: "0x2382a5878a44a6de5c3d91537d4132dc29e93c60",
        totalReferrals: 4,
        totalIncrementalDuration: 9676800,
        totalRevenueContribution: 13_000_000_000_000_000n, // 0.013 ETH
        score: 0.30664558478271287,
        rank: 8,
        isQualified: true,
        finalScoreBoost: 0.2222222222222222,
        finalScore: 0.3747890480677602,
        awardPoolShare: 0.022642896526373826,
        awardPoolApproxValue: 226.42896526373826,
      },
    ],
    [
      "0x0000ffa596cdf9a69676e689b1a92e5e68171122",
      {
        referrer: "0x0000ffa596cdf9a69676e689b1a92e5e68171122",
        totalReferrals: 1,
        totalIncrementalDuration: 7948800,
        totalRevenueContribution: 5_000_000_000_000_000n, // 0.005 ETH
        score: 0.2518874446429427,
        rank: 9,
        isQualified: true,
        finalScoreBoost: 0.11111111111111116,
        finalScore: 0.2798749384921586,
        awardPoolShare: 0.016908656496967468,
        awardPoolApproxValue: 169.08656496967467,
      },
    ],
    [
      "0xc7190732aa0c3d523d945530bec6caeb8489b4a5",
      {
        referrer: "0xc7190732aa0c3d523d945530bec6caeb8489b4a5",
        totalReferrals: 3,
        totalIncrementalDuration: 7257600,
        totalRevenueContribution: 9_000_000_000_000_000n, // 0.009 ETH
        score: 0.22998418858703465,
        rank: 10,
        isQualified: true,
        finalScoreBoost: 0,
        finalScore: 0.22998418858703465,
        awardPoolShare: 0.013894504686638484,
        awardPoolApproxValue: 138.94504686638484,
      },
    ],
    [
      "0x98c54f630c38c434cff2a1e3be9e095977cdc6af",
      {
        referrer: "0x98c54f630c38c434cff2a1e3be9e095977cdc6af",
        totalReferrals: 3,
        totalIncrementalDuration: 7257600,
        totalRevenueContribution: 9_000_000_000_000_000n, // 0.009 ETH
        score: 0.22998418858703465,
        rank: 11,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.22998418858703465,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    [
      "0xadc318567a4a16db3839208b435184ae86ba3e43",
      {
        referrer: "0xadc318567a4a16db3839208b435184ae86ba3e43",
        totalReferrals: 2,
        totalIncrementalDuration: 4838400,
        totalRevenueContribution: 6_000_000_000_000_000n, // 0.006 ETH
        score: 0.15332279239135643,
        rank: 12,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.15332279239135643,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    [
      "0x7e5d0cdd8144d0ec6ef7140e65714c011d462dbf",
      {
        referrer: "0x7e5d0cdd8144d0ec6ef7140e65714c011d462dbf",
        totalReferrals: 2,
        totalIncrementalDuration: 4838400,
        totalRevenueContribution: 6_000_000_000_000_000n, // 0.006 ETH
        score: 0.15332279239135643,
        rank: 13,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.15332279239135643,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    [
      "0x71afe4867bef795a686d13f4dc60bc8d3a4e70f6",
      {
        referrer: "0x71afe4867bef795a686d13f4dc60bc8d3a4e70f6",
        totalReferrals: 2,
        totalIncrementalDuration: 4838400,
        totalRevenueContribution: 6_000_000_000_000_000n, // 0.006 ETH
        score: 0.15332279239135643,
        rank: 14,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.15332279239135643,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    [
      "0x58879236e40b73482f585a5f74766d6b99cb1057",
      {
        referrer: "0x58879236e40b73482f585a5f74766d6b99cb1057",
        totalReferrals: 2,
        totalIncrementalDuration: 4838400,
        totalRevenueContribution: 6_000_000_000_000_000n, // 0.006 ETH
        score: 0.15332279239135643,
        rank: 15,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.15332279239135643,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    [
      "0x32eccaf03d59d87c8a164cffea7cb0c4b3b9d481",
      {
        referrer: "0x32eccaf03d59d87c8a164cffea7cb0c4b3b9d481",
        totalReferrals: 2,
        totalIncrementalDuration: 4838400,
        totalRevenueContribution: 6_000_000_000_000_000n, // 0.006 ETH
        score: 0.15332279239135643,
        rank: 16,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.15332279239135643,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    [
      "0x2254f9bab9b3d56994504c46932289447a708529",
      {
        referrer: "0x2254f9bab9b3d56994504c46932289447a708529",
        totalReferrals: 2,
        totalIncrementalDuration: 4838400,
        totalRevenueContribution: 6_000_000_000_000_000n, // 0.006 ETH
        score: 0.15332279239135643,
        rank: 17,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.15332279239135643,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    [
      "0x54e7c79aceb6b736da4c29da088aae30991635bb",
      {
        referrer: "0x54e7c79aceb6b736da4c29da088aae30991635bb",
        totalReferrals: 2,
        totalIncrementalDuration: 4579200,
        totalRevenueContribution: 0n, // 0 ETH
        score: 0.14510907137039092,
        rank: 18,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.14510907137039092,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    [
      "0xe3cc38fb4da8a96a6ab245022e6778a1ed32619c",
      {
        referrer: "0xe3cc38fb4da8a96a6ab245022e6778a1ed32619c",
        totalReferrals: 1,
        totalIncrementalDuration: 3974400,
        totalRevenueContribution: 0n, // 0 ETH
        score: 0.12594372232147136,
        rank: 19,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.12594372232147136,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    [
      "0xce5ecf6d9e2181ad77b53305e2b1b6eca54728f0",
      {
        referrer: "0xce5ecf6d9e2181ad77b53305e2b1b6eca54728f0",
        totalReferrals: 1,
        totalIncrementalDuration: 3628800,
        totalRevenueContribution: 4_000_000_000_000_000n, // 0.004 ETH
        score: 0.11499209429351732,
        rank: 20,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.11499209429351732,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    [
      "0x8354d821a89cc3c37902b60e9f30a15a6f810096",
      {
        referrer: "0x8354d821a89cc3c37902b60e9f30a15a6f810096",
        totalReferrals: 2,
        totalIncrementalDuration: 2505600,
        totalRevenueContribution: 5_500_000_000_000_000n, // 0.0055 ETH
        score: 0.07939930320266672,
        rank: 21,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.07939930320266672,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    [
      "0x7bddd635be34bcf860d5f02ae53b16fcd17e8f6f",
      {
        referrer: "0x7bddd635be34bcf860d5f02ae53b16fcd17e8f6f",
        totalReferrals: 3,
        totalIncrementalDuration: 2419203,
        totalRevenueContribution: 11_000_000_000_000_000n, // 0.011 ETH
        score: 0.07666149126189374,
        rank: 22,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.07666149126189374,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    [
      "0xf5746ef53ed961afd3b2a6c6d13de65e1605d215",
      {
        referrer: "0xf5746ef53ed961afd3b2a6c6d13de65e1605d215",
        totalReferrals: 1,
        totalIncrementalDuration: 2419200,
        totalRevenueContribution: 3_000_000_000_000_000n, // 0.003 ETH
        score: 0.07666139619567822,
        rank: 23,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.07666139619567822,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    [
      "0xf35d9e265d20096af90a891205020ffab9291c8b",
      {
        referrer: "0xf35d9e265d20096af90a891205020ffab9291c8b",
        totalReferrals: 1,
        totalIncrementalDuration: 2419200,
        totalRevenueContribution: 3_000_000_000_000_000n, // 0.003 ETH
        score: 0.07666139619567822,
        rank: 24,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.07666139619567822,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    [
      "0xe45fb62899ccc74449923c7b34a91d7b9ee27d9f",
      {
        referrer: "0xe45fb62899ccc74449923c7b34a91d7b9ee27d9f",
        totalReferrals: 1,
        totalIncrementalDuration: 2419200,
        totalRevenueContribution: 3_000_000_000_000_000n, // 0.003 ETH
        score: 0.07666139619567822,
        rank: 25,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.07666139619567822,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    [
      "0x9b86be6324d8d56247c04b2ec7ea4d0149fb1f64",
      {
        referrer: "0x9b86be6324d8d56247c04b2ec7ea4d0149fb1f64",
        totalReferrals: 1,
        totalIncrementalDuration: 2419200,
        totalRevenueContribution: 3_000_000_000_000_000n, // 0.003 ETH
        score: 0.07666139619567822,
        rank: 26,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.07666139619567822,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    [
      "0x531a360408b69dcf325115921064c6e784cdc297",
      {
        referrer: "0x531a360408b69dcf325115921064c6e784cdc297",
        totalReferrals: 1,
        totalIncrementalDuration: 2419200,
        totalRevenueContribution: 3_000_000_000_000_000n, // 0.003 ETH
        score: 0.07666139619567822,
        rank: 27,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.07666139619567822,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    [
      "0x3d93f8a930023263c17a639580525a561072458c",
      {
        referrer: "0x3d93f8a930023263c17a639580525a561072458c",
        totalReferrals: 1,
        totalIncrementalDuration: 2419200,
        totalRevenueContribution: 3_000_000_000_000_000n, // 0.003 ETH
        score: 0.07666139619567822,
        rank: 28,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.07666139619567822,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    [
      "0x1779c4ad42cd07e437b6c6444b539ea1734fcaf4",
      {
        referrer: "0x1779c4ad42cd07e437b6c6444b539ea1734fcaf4",
        totalReferrals: 1,
        totalIncrementalDuration: 2419200,
        totalRevenueContribution: 3_000_000_000_000_000n, // 0.003 ETH
        score: 0.07666139619567822,
        rank: 29,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.07666139619567822,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
  ]),
  accurateAsOf: 1735689600,
};

export const referrerLeaderboardPageResponseOk: ReferrerLeaderboardPageResponseOk = {
  responseCode: ReferrerLeaderboardPageResponseCodes.Ok,
  data: {
    rules: {
      totalAwardPoolValue: 10000,
      maxQualifiedReferrers: 10,
      startTime: 1735689600,
      endTime: 1767225599,
      subregistryId: {
        chainId: 1,
        address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
      },
    },
    referrers: [
      {
        referrer: "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e",
        totalReferrals: 3,
        totalIncrementalDuration: 94694400,
        totalRevenueContribution: 15_000_000_000_000_000n, // 0.015 ETH
        score: 3.0007460796594043,
        rank: 1,
        isQualified: true,
        finalScoreBoost: 1,
        finalScore: 6.001492159318809,
        awardPoolShare: 0.36258040801323277,
        awardPoolApproxValue: 3625.8040801323277,
      },
      {
        referrer: "0xcfa4f8192ad39d1ee09f473e88e79d267e09ddca",
        totalReferrals: 2,
        totalIncrementalDuration: 63072000,
        totalRevenueContribution: 10_000_000_000_000_000n, // 0.01 ETH
        score: 1.9986721151016105,
        rank: 2,
        isQualified: true,
        finalScoreBoost: 0.8888888888888888,
        finalScore: 3.7752695507474865,
        awardPoolShare: 0.22808307296452854,
        awardPoolApproxValue: 2280.8307296452854,
      },
      {
        referrer: "0x00000000000000000000000000000000000000f1",
        totalReferrals: 3,
        totalIncrementalDuration: 39657600,
        totalRevenueContribution: 12_000_000_000_000_000n, // 0.012 ETH
        score: 1.256699316207725,
        rank: 3,
        isQualified: true,
        finalScoreBoost: 0.7777777777777778,
        finalScore: 2.234132117702622,
        awardPoolShare: 0.1349751883844881,
        awardPoolApproxValue: 1349.7518838448811,
      },
      {
        referrer: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        totalReferrals: 4,
        totalIncrementalDuration: 34214400,
        totalRevenueContribution: 18_000_000_000_000_000n, // 0.018 ETH
        score: 1.084211174767449,
        rank: 4,
        isQualified: true,
        finalScoreBoost: 0.6666666666666667,
        finalScore: 1.8070186246124151,
        awardPoolShare: 0.10917110825215952,
        awardPoolApproxValue: 1091.7110825215952,
      },
      {
        referrer: "0xabe3fdb4d2cd5f2e7193a4ac380ecb68e899896a",
        totalReferrals: 7,
        totalIncrementalDuration: 15120000,
        totalRevenueContribution: 21_000_000_000_000_000n, // 0.021 ETH
        score: 0.47913372622298883,
        rank: 5,
        isQualified: true,
        finalScoreBoost: 0.5555555555555556,
        finalScore: 0.7453191296802049,
        awardPoolShare: 0.04502848741040249,
        awardPoolApproxValue: 450.2848741040249,
      },
      {
        referrer: "0xffa596cdf9a69676e689b1a92e5e681711227d75",
        totalReferrals: 5,
        totalIncrementalDuration: 12960000,
        totalRevenueContribution: 16_000_000_000_000_000n, // 0.016 ETH
        score: 0.41068605104827616,
        rank: 6,
        isQualified: true,
        finalScoreBoost: 0.4444444444444444,
        finalScore: 0.59321318484751,
        awardPoolShare: 0.035839000183789736,
        awardPoolApproxValue: 358.3900018378974,
      },
      {
        referrer: "0x2a614b7984854177d22fa23a4034a13ea82e4f97",
        totalReferrals: 5,
        totalIncrementalDuration: 12096000,
        totalRevenueContribution: 14_000_000_000_000_000n, // 0.014 ETH
        score: 0.38330698097839105,
        rank: 7,
        isQualified: true,
        finalScoreBoost: 0.33333333333333337,
        finalScore: 0.5110759746378548,
        awardPoolShare: 0.030876677081418856,
        awardPoolApproxValue: 308.76677081418853,
      },
      {
        referrer: "0x2382a5878a44a6de5c3d91537d4132dc29e93c60",
        totalReferrals: 4,
        totalIncrementalDuration: 9676800,
        totalRevenueContribution: 13_000_000_000_000_000n, // 0.013 ETH
        score: 0.30664558478271287,
        rank: 8,
        isQualified: true,
        finalScoreBoost: 0.2222222222222222,
        finalScore: 0.3747890480677602,
        awardPoolShare: 0.022642896526373826,
        awardPoolApproxValue: 226.42896526373826,
      },
      {
        referrer: "0x0000ffa596cdf9a69676e689b1a92e5e68171122",
        totalReferrals: 1,
        totalIncrementalDuration: 7948800,
        totalRevenueContribution: 5_000_000_000_000_000n, // 0.005 ETH
        score: 0.2518874446429427,
        rank: 9,
        isQualified: true,
        finalScoreBoost: 0.11111111111111116,
        finalScore: 0.2798749384921586,
        awardPoolShare: 0.016908656496967468,
        awardPoolApproxValue: 169.08656496967467,
      },
      {
        referrer: "0xc7190732aa0c3d523d945530bec6caeb8489b4a5",
        totalReferrals: 3,
        totalIncrementalDuration: 7257600,
        totalRevenueContribution: 9_000_000_000_000_000n, // 0.009 ETH
        score: 0.22998418858703465,
        rank: 10,
        isQualified: true,
        finalScoreBoost: 0,
        finalScore: 0.22998418858703465,
        awardPoolShare: 0.013894504686638484,
        awardPoolApproxValue: 138.94504686638484,
      },
      {
        referrer: "0x98c54f630c38c434cff2a1e3be9e095977cdc6af",
        totalReferrals: 3,
        totalIncrementalDuration: 7257600,
        totalRevenueContribution: 9_000_000_000_000_000n, // 0.009 ETH
        score: 0.22998418858703465,
        rank: 11,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.22998418858703465,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
      {
        referrer: "0xadc318567a4a16db3839208b435184ae86ba3e43",
        totalReferrals: 2,
        totalIncrementalDuration: 4838400,
        totalRevenueContribution: 6_000_000_000_000_000n, // 0.006 ETH
        score: 0.15332279239135643,
        rank: 12,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.15332279239135643,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
      {
        referrer: "0x7e5d0cdd8144d0ec6ef7140e65714c011d462dbf",
        totalReferrals: 2,
        totalIncrementalDuration: 4838400,
        totalRevenueContribution: 6_000_000_000_000_000n, // 0.006 ETH
        score: 0.15332279239135643,
        rank: 13,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.15332279239135643,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
      {
        referrer: "0x71afe4867bef795a686d13f4dc60bc8d3a4e70f6",
        totalReferrals: 2,
        totalIncrementalDuration: 4838400,
        totalRevenueContribution: 6_000_000_000_000_000n, // 0.006 ETH
        score: 0.15332279239135643,
        rank: 14,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.15332279239135643,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
      {
        referrer: "0x58879236e40b73482f585a5f74766d6b99cb1057",
        totalReferrals: 2,
        totalIncrementalDuration: 4838400,
        totalRevenueContribution: 6_000_000_000_000_000n, // 0.006 ETH
        score: 0.15332279239135643,
        rank: 15,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.15332279239135643,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
      {
        referrer: "0x32eccaf03d59d87c8a164cffea7cb0c4b3b9d481",
        totalReferrals: 2,
        totalIncrementalDuration: 4838400,
        totalRevenueContribution: 6_000_000_000_000_000n, // 0.006 ETH
        score: 0.15332279239135643,
        rank: 16,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.15332279239135643,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
      {
        referrer: "0x2254f9bab9b3d56994504c46932289447a708529",
        totalReferrals: 2,
        totalIncrementalDuration: 4838400,
        totalRevenueContribution: 6_000_000_000_000_000n, // 0.006 ETH
        score: 0.15332279239135643,
        rank: 17,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.15332279239135643,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
      {
        referrer: "0x54e7c79aceb6b736da4c29da088aae30991635bb",
        totalReferrals: 2,
        totalIncrementalDuration: 4579200,
        totalRevenueContribution: 0n, // 0 ETH
        score: 0.14510907137039092,
        rank: 18,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.14510907137039092,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
      {
        referrer: "0xe3cc38fb4da8a96a6ab245022e6778a1ed32619c",
        totalReferrals: 1,
        totalIncrementalDuration: 3974400,
        totalRevenueContribution: 0n, // 0 ETH
        score: 0.12594372232147136,
        rank: 19,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.12594372232147136,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
      {
        referrer: "0xce5ecf6d9e2181ad77b53305e2b1b6eca54728f0",
        totalReferrals: 1,
        totalIncrementalDuration: 3628800,
        totalRevenueContribution: 4_000_000_000_000_000n, // 0.004 ETH
        score: 0.11499209429351732,
        rank: 20,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.11499209429351732,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
      {
        referrer: "0x8354d821a89cc3c37902b60e9f30a15a6f810096",
        totalReferrals: 2,
        totalIncrementalDuration: 2505600,
        totalRevenueContribution: 5_500_000_000_000_000n, // 0.0055 ETH
        score: 0.07939930320266672,
        rank: 21,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.07939930320266672,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
      {
        referrer: "0x7bddd635be34bcf860d5f02ae53b16fcd17e8f6f",
        totalReferrals: 3,
        totalIncrementalDuration: 2419203,
        totalRevenueContribution: 11_000_000_000_000_000n, // 0.011 ETH
        score: 0.07666149126189374,
        rank: 22,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.07666149126189374,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
      {
        referrer: "0xf5746ef53ed961afd3b2a6c6d13de65e1605d215",
        totalReferrals: 1,
        totalIncrementalDuration: 2419200,
        totalRevenueContribution: 3_000_000_000_000_000n, // 0.003 ETH
        score: 0.07666139619567822,
        rank: 23,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.07666139619567822,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
      {
        referrer: "0xf35d9e265d20096af90a891205020ffab9291c8b",
        totalReferrals: 1,
        totalIncrementalDuration: 2419200,
        totalRevenueContribution: 3_000_000_000_000_000n, // 0.003 ETH
        score: 0.07666139619567822,
        rank: 24,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.07666139619567822,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
      {
        referrer: "0xe45fb62899ccc74449923c7b34a91d7b9ee27d9f",
        totalReferrals: 1,
        totalIncrementalDuration: 2419200,
        totalRevenueContribution: 3_000_000_000_000_000n, // 0.003 ETH
        score: 0.07666139619567822,
        rank: 25,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.07666139619567822,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
      {
        referrer: "0x9b86be6324d8d56247c04b2ec7ea4d0149fb1f64",
        totalReferrals: 1,
        totalIncrementalDuration: 2419200,
        totalRevenueContribution: 3_000_000_000_000_000n, // 0.003 ETH
        score: 0.07666139619567822,
        rank: 26,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.07666139619567822,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
      {
        referrer: "0x531a360408b69dcf325115921064c6e784cdc297",
        totalReferrals: 1,
        totalIncrementalDuration: 2419200,
        totalRevenueContribution: 3_000_000_000_000_000n, // 0.003 ETH
        score: 0.07666139619567822,
        rank: 27,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.07666139619567822,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
      {
        referrer: "0x3d93f8a930023263c17a639580525a561072458c",
        totalReferrals: 1,
        totalIncrementalDuration: 2419200,
        totalRevenueContribution: 3_000_000_000_000_000n, // 0.003 ETH
        score: 0.07666139619567822,
        rank: 28,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.07666139619567822,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
      {
        referrer: "0x1779c4ad42cd07e437b6c6444b539ea1734fcaf4",
        totalReferrals: 1,
        totalIncrementalDuration: 2419200,
        totalRevenueContribution: 3_000_000_000_000_000n, // 0.003 ETH
        score: 0.07666139619567822,
        rank: 29,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0.07666139619567822,
        awardPoolShare: 0,
        awardPoolApproxValue: 0,
      },
    ],
    aggregatedMetrics: {
      grandTotalReferrals: 68,
      grandTotalIncrementalDuration: 367027203,
      grandTotalRevenueContribution: 235_000_000_000_000_000n, // 0.235 ETH
      grandTotalQualifiedReferrersFinalScore: 16.55216891669386,
      minFinalScoreToQualify: 0,
    },
    pageContext: {
      page: 1,
      recordsPerPage: 100,
      totalRecords: 29,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
      startIndex: 0,
      endIndex: 28,
    },
    accurateAsOf: 1735689600,
  },
};
