import { describe, expect, it } from "vitest";
import { buildUrl } from "./url";

describe("buildUrl", () => {
  describe("explicit protocol handling", () => {
    it("accepts URLs with explicit HTTPS protocol", () => {
      const result = buildUrl("https://example.com");

      expect(result.protocol).toBe("https:");
      expect(result.hostname).toBe("example.com");
      expect(result.port).toBe("");
    });

    it("accepts URLs with explicit HTTP protocol", () => {
      const result = buildUrl("http://example.com");

      expect(result.protocol).toBe("http:");
      expect(result.hostname).toBe("example.com");
      expect(result.port).toBe("");
    });

    it("accepts URLs with other protocols", () => {
      const testCases = [
        { url: "ftp://example.com", protocol: "ftp:" },
        { url: "ws://example.com", protocol: "ws:" },
        { url: "wss://example.com", protocol: "wss:" },
      ];

      testCases.forEach(({ url, protocol }) => {
        const result = buildUrl(url);
        expect(result.protocol).toBe(protocol);
        expect(result.hostname).toBe("example.com");
      });
    });

    it("handles case sensitivity for protocols", () => {
      const testCases = ["HTTP://example.com", "HTTPS://example.com", "Http://example.com"];

      testCases.forEach((url) => {
        const result = buildUrl(url);
        expect(result.hostname).toBe("example.com");
      });
    });
  });

  describe("implicit HTTPS protocol", () => {
    it("adds implicit HTTPS protocol when no protocol is provided", () => {
      const result = buildUrl("example.com");

      expect(result.protocol).toBe("https:");
      expect(result.hostname).toBe("example.com");
    });

    it("adds implicit HTTPS protocol for localhost", () => {
      const result = buildUrl("localhost:3000");

      expect(result.protocol).toBe("https:");
      expect(result.hostname).toBe("localhost");
      expect(result.port).toBe("3000");
    });

    it("adds implicit HTTPS protocol for URLs with ports", () => {
      const result = buildUrl("api.example.com:8080");

      expect(result.protocol).toBe("https:");
      expect(result.hostname).toBe("api.example.com");
      expect(result.port).toBe("8080");
    });

    it("adds implicit HTTPS protocol for URLs with paths", () => {
      const result = buildUrl("example.com/path/to/resource");

      expect(result.protocol).toBe("https:");
      expect(result.hostname).toBe("example.com");
      expect(result.pathname).toBe("/path/to/resource");
    });

    it("adds implicit HTTPS protocol for URLs with query params", () => {
      const result = buildUrl("example.com?query=value");

      expect(result.protocol).toBe("https:");
      expect(result.hostname).toBe("example.com");
      expect(result.search).toBe("?query=value");
    });

    it("adds implicit HTTPS protocol for URLs with hash fragments", () => {
      const result = buildUrl("example.com#section");

      expect(result.protocol).toBe("https:");
      expect(result.hostname).toBe("example.com");
      expect(result.hash).toBe("#section");
    });
  });

  describe("URLs with ports", () => {
    it("accepts URLs with explicit ports", () => {
      const result = buildUrl("https://example.com:8080");

      expect(result.protocol).toBe("https:");
      expect(result.hostname).toBe("example.com");
      expect(result.port).toBe("8080");
    });

    it("accepts URLs with various port numbers", () => {
      const testCases = [
        "https://example.com:80",
        "https://example.com:443",
        "https://example.com:3000",
        "https://example.com:8080",
        "http://example.com:80",
      ];

      testCases.forEach((url) => {
        const result = buildUrl(url);
        expect(result.hostname).toBe("example.com");
      });
    });

    it("accepts URLs with trailing colon (empty port)", () => {
      const result = buildUrl("https://example.com:");

      expect(result.hostname).toBe("example.com");
      expect(result.port).toBe("");
    });
  });

  describe("localhost URLs", () => {
    it("accepts localhost URLs with explicit protocol", () => {
      const testCases = ["http://localhost", "https://localhost"];

      testCases.forEach((url) => {
        const result = buildUrl(url);
        expect(result.hostname).toBe("localhost");
      });
    });

    it("accepts localhost URLs with ports", () => {
      const testCases = ["http://localhost:3000", "https://localhost:8080"];

      testCases.forEach((url) => {
        const result = buildUrl(url);
        expect(result.hostname).toBe("localhost");
      });
    });
  });

  describe("URLs with paths, query params, and hash fragments", () => {
    it("accepts URLs with paths", () => {
      const result = buildUrl("https://example.com/path/to/resource");

      expect(result.pathname).toBe("/path/to/resource");
    });

    it("accepts URLs with query parameters", () => {
      const result = buildUrl("https://example.com?param=value&other=test");

      expect(result.search).toBe("?param=value&other=test");
    });

    it("accepts URLs with hash fragments", () => {
      const result = buildUrl("https://example.com#section");

      expect(result.hash).toBe("#section");
    });

    it("accepts URLs with all components", () => {
      const result = buildUrl("https://api.example.com:8080/path?query=value#anchor");

      expect(result.protocol).toBe("https:");
      expect(result.hostname).toBe("api.example.com");
      expect(result.port).toBe("8080");
      expect(result.pathname).toBe("/path");
      expect(result.search).toBe("?query=value");
      expect(result.hash).toBe("#anchor");
    });
  });

  describe("IP addresses", () => {
    it("accepts URLs with IPv4 addresses", () => {
      const testCases = [
        "http://192.168.1.1",
        "https://192.168.1.1:8080",
        "http://127.0.0.1",
        "https://127.0.0.1:3000",
      ];

      testCases.forEach((url) => {
        const result = buildUrl(url);
        expect(result.protocol).toMatch(/^https?:$/);
      });
    });

    it("adds implicit HTTPS protocol for IP addresses without protocol", () => {
      const result = buildUrl("192.168.1.1:8080");

      expect(result.protocol).toBe("https:");
      expect(result.hostname).toBe("192.168.1.1");
      expect(result.port).toBe("8080");
    });
  });

  describe("error handling", () => {
    it("throws for invalid URLs", () => {
      const testCases = ["://example.com", "https://", "http://"];

      testCases.forEach((url) => {
        expect(() => buildUrl(url)).toThrow();
      });
    });

    it("throws for empty string", () => {
      expect(() => buildUrl("")).toThrow();
    });

    it("throws for whitespace-only strings", () => {
      const testCases = [" ", "  ", "\t", "\n"];

      testCases.forEach((url) => {
        expect(() => buildUrl(url)).toThrow();
      });
    });

    it("throws for malformed port numbers", () => {
      const testCases = [
        "https://example.com:99999", // Port out of range
        "https://example.com:-1", // Negative port
        "https://example.com:abc", // Non-numeric port
      ];

      testCases.forEach((url) => {
        expect(() => buildUrl(url)).toThrow();
      });
    });
  });

  describe("edge cases", () => {
    it("handles URLs with subdomains", () => {
      const testCases = [
        "https://api.example.com",
        "https://www.example.com",
        "https://sub.domain.example.com",
      ];

      testCases.forEach((url) => {
        const result = buildUrl(url);
        expect(result.protocol).toBe("https:");
      });
    });

    it("handles internationalized domain names", () => {
      const testCases = ["https://测试.com", "https://пример.рф", "https://münchen.de"];

      testCases.forEach((url) => {
        const result = buildUrl(url);
        expect(result.hostname).toContain(".");
      });
    });

    it("handles URLs with special characters in hostname", () => {
      const testCases = ["https://test-site.com", "https://test_site.com", "https://test123.com"];

      testCases.forEach((url) => {
        const result = buildUrl(url);
        expect(result.protocol).toBe("https:");
      });
    });
  });
});
