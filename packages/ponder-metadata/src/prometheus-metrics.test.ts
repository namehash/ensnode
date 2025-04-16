import { describe, expect, it } from "vitest";
import { PrometheusMetrics, parsePrometheusText } from "./prometheus-metrics";

describe("prom-parser", () => {
  const testMetrics = `
# HELP ponder_version_info Ponder version information
# TYPE ponder_version_info gauge
ponder_version_info{version="0.9.18",major="0",minor="9",patch="18"} 1

# HELP ponder_settings_info Ponder settings information
# TYPE ponder_settings_info gauge
ponder_settings_info{ordering="omnichain",database="postgres",command="dev"} 1

# HELP ponder_historical_start_timestamp_seconds Timestamp at which historical indexing started
# TYPE ponder_historical_start_timestamp_seconds gauge
ponder_historical_start_timestamp_seconds 1740391265

# HELP ponder_historical_total_indexing_seconds Total number of seconds that are required
# TYPE ponder_historical_total_indexing_seconds gauge
ponder_historical_total_indexing_seconds{network="1"} 251224935
ponder_historical_total_indexing_seconds{network="8453"} 251224935

# HELP ponder_indexing_has_error Boolean (0 or 1) indicating if there is an indexing error
# TYPE ponder_indexing_has_error gauge
ponder_indexing_has_error 0
`;

  describe("parsePrometheusText", () => {
    it("should parse version info metrics", () => {
      const result = parsePrometheusText(testMetrics);
      const versionInfo = result.find((m) => m.name === "ponder_version_info");

      expect(versionInfo).toEqual({
        name: "ponder_version_info",
        help: "Ponder version information",
        type: "gauge",
        metrics: [
          {
            value: 1,
            labels: {
              version: "0.9.18",
              major: "0",
              minor: "9",
              patch: "18",
            },
          },
        ],
      });
    });

    it("should parse settings info metrics", () => {
      const result = parsePrometheusText(testMetrics);
      const settingsInfo = result.find((m) => m.name === "ponder_settings_info");

      expect(settingsInfo).toEqual({
        name: "ponder_settings_info",
        help: "Ponder settings information",
        type: "gauge",
        metrics: [
          {
            value: 1,
            labels: {
              ordering: "omnichain",
              database: "postgres",
              command: "dev",
            },
          },
        ],
      });
    });
  });

  describe("PrometheusMetrics", () => {
    const parser = PrometheusMetrics.parse(testMetrics);

    it("should get version information", () => {
      expect(parser.getLabel("ponder_version_info", "version")).toBe("0.9.18");
      expect(parser.getLabel("ponder_version_info", "major")).toBe("0");
      expect(parser.getLabel("ponder_version_info", "minor")).toBe("9");
      expect(parser.getLabel("ponder_version_info", "patch")).toBe("18");
    });

    it("should get settings information", () => {
      expect(parser.getLabel("ponder_settings_info", "ordering")).toBe("omnichain");
      expect(parser.getLabel("ponder_settings_info", "database")).toBe("postgres");
      expect(parser.getLabel("ponder_settings_info", "command")).toBe("dev");
    });

    it("should get historical timestamps", () => {
      expect(parser.getValue("ponder_historical_start_timestamp_seconds")).toBe(1740391265);
    });

    it("should get network-specific metrics", () => {
      // Test network 1
      expect(parser.getValue("ponder_historical_total_indexing_seconds", { network: "1" })).toBe(
        251224935,
      );

      // Test network 8453
      expect(parser.getValue("ponder_historical_total_indexing_seconds", { network: "8453" })).toBe(
        251224935,
      );
    });

    it("should get all network IDs", () => {
      const networks = parser.getLabels("ponder_historical_total_indexing_seconds", "network");
      expect(networks).toContain("1");
      expect(networks).toContain("8453");
      expect(networks.length).toBe(2);
    });

    it("should get indexing has error metrics", () => {
      expect(parser.getValue("ponder_indexing_has_error")).toBe(0);
    });

    it("should get help text", () => {
      expect(parser.getHelp("ponder_historical_start_timestamp_seconds")).toBe(
        "Timestamp at which historical indexing started",
      );
    });

    it("should get metric type", () => {
      expect(parser.getType("ponder_version_info")).toBe("gauge");
      expect(parser.getType("ponder_settings_info")).toBe("gauge");
    });
  });
});
