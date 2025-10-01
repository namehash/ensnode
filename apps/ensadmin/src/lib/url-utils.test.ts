import { describe, expect, it } from "vitest";
import { buildHttpHostname } from "./url-utils";

describe("buildHttpHostname", () => {
  describe("valid URLs", () => {
    it("accepts valid HTTPS URLs", () => {
      const result = buildHttpHostname("https://example.com");

      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.url.protocol).toBe("https:");
        expect(result.url.hostname).toBe("example.com");
        expect(result.url.port).toBe("");
      }
    });

    it("accepts valid HTTP URLs", () => {
      const result = buildHttpHostname("http://example.com");

      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.url.protocol).toBe("http:");
        expect(result.url.hostname).toBe("example.com");
        expect(result.url.port).toBe("");
      }
    });

    it("accepts URLs with explicit ports", () => {
      const result = buildHttpHostname("https://example.com:8080");

      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.url.protocol).toBe("https:");
        expect(result.url.hostname).toBe("example.com");
        expect(result.url.port).toBe("8080");
      }
    });

    it("accepts URLs with various port numbers", () => {
      const testCases = [
        "https://example.com:80",
        "https://example.com:443",
        "https://example.com:3000",
        "https://example.com:8080",
        "https://example.com:9999",
        "http://example.com:80",
        "http://example.com:8080",
      ];

      testCases.forEach((url) => {
        const result = buildHttpHostname(url);
        expect(result.isValid).toBe(true);
        if (result.isValid) {
          expect(result.url.hostname).toBe("example.com");
        }
      });
    });

    it("accepts localhost URLs", () => {
      const testCases = [
        "http://localhost",
        "https://localhost",
        "http://localhost:3000",
        "https://localhost:8080",
      ];

      testCases.forEach((url) => {
        const result = buildHttpHostname(url);
        expect(result.isValid).toBe(true);
        if (result.isValid) {
          expect(result.url.hostname).toBe("localhost");
        }
      });
    });

    it("accepts URLs with subdomains", () => {
      const testCases = [
        "https://api.example.com",
        "https://www.example.com",
        "https://sub.domain.example.com",
        "https://api.example.com:8080",
      ];

      testCases.forEach((url) => {
        const result = buildHttpHostname(url);
        expect(result.isValid).toBe(true);
      });
    });

    it("accepts URLs with IP addresses", () => {
      const testCases = [
        "http://192.168.1.1",
        "https://192.168.1.1:8080",
        "http://127.0.0.1",
        "https://127.0.0.1:3000",
      ];

      testCases.forEach((url) => {
        const result = buildHttpHostname(url);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe("implicit protocol handling", () => {
    it("adds implicit HTTPS protocol when no protocol is provided", () => {
      const result = buildHttpHostname("example.com");

      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.url.protocol).toBe("https:");
        expect(result.url.hostname).toBe("example.com");
      }
    });

    it("adds implicit HTTPS protocol for localhost", () => {
      const result = buildHttpHostname("localhost:3000");

      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.url.protocol).toBe("https:");
        expect(result.url.hostname).toBe("localhost");
        expect(result.url.port).toBe("3000");
      }
    });

    it("adds implicit HTTPS protocol for URLs with ports", () => {
      const result = buildHttpHostname("api.example.com:8080");

      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.url.protocol).toBe("https:");
        expect(result.url.hostname).toBe("api.example.com");
        expect(result.url.port).toBe("8080");
      }
    });
  });

  describe("invalid protocol errors", () => {
    it("rejects URLs with unsupported protocols", () => {
      const testCases = [
        "ftp://example.com",
        "ws://example.com",
        "wss://example.com",
        "file://example.com",
        "data://example.com",
      ];

      testCases.forEach((url) => {
        const result = buildHttpHostname(url);
        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.error).toBe("URL must use HTTP or HTTPS protocol");
        }
      });
    });

    it("handles case sensitivity for protocols", () => {
      const testCases = [
        "HTTP://example.com",
        "HTTPS://example.com",
        "Http://example.com",
        "Https://example.com",
      ];

      testCases.forEach((url) => {
        const result = buildHttpHostname(url);
        expect(result.isValid).toBe(true);
        if (result.isValid) {
          expect(result.url.hostname).toBe("example.com");
        }
      });
    });
  });

  describe("invalid hostname errors", () => {
    it("rejects hostnames without dots that are not localhost", () => {
      const testCases = [
        "https://abc",
        "https://test",
        "https://api",
        "https://myapp",
        "http://singleword",
      ];

      testCases.forEach((url) => {
        const result = buildHttpHostname(url);
        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.error).toBe("Invalid hostname");
        }
      });
    });

    it("rejects empty hostnames", () => {
      const result = buildHttpHostname("https://");
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe("Invalid URL");
      }
    });
  });

  describe("path validation errors", () => {
    it("rejects URLs with paths", () => {
      const testCases = [
        "https://example.com/path",
        "https://example.com/path/to/resource",
        "https://example.com/api/v1",
        "http://localhost:3000/app",
      ];

      testCases.forEach((url) => {
        const result = buildHttpHostname(url);
        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.error).toBe(
            "URL must not include a non-root path (e.g. '/path/to/resource')",
          );
        }
      });
    });

    it("accepts URLs with root path", () => {
      const testCases = [
        "https://example.com/",
        "http://localhost:3000/",
        "https://api.example.com:8080/",
      ];

      testCases.forEach((url) => {
        const result = buildHttpHostname(url);
        expect(result.isValid).toBe(true);
        if (result.isValid) {
          expect(result.url.pathname).toBe("/");
        }
      });
    });
  });

  describe("query parameter validation errors", () => {
    it("rejects URLs with query parameters", () => {
      const testCases = [
        "https://example.com?param=value",
        "https://example.com?query=test&other=value",
        "https://example.com:8080?port=3000",
        "http://localhost?debug=true",
      ];

      testCases.forEach((url) => {
        const result = buildHttpHostname(url);
        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.error).toBe("URL must not include query params (e.g. '?query=value')");
        }
      });
    });
  });

  describe("hash validation errors", () => {
    it("rejects URLs with hash fragments", () => {
      const testCases = [
        "https://example.com#section",
        "https://example.com#anchor",
        "https://example.com:8080#top",
        "http://localhost#main",
      ];

      testCases.forEach((url) => {
        const result = buildHttpHostname(url);
        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.error).toBe("URL must not include a link fragment (e.g. '#anchor')");
        }
      });
    });
  });

  describe("malformed URL errors", () => {
    it("rejects malformed URLs", () => {
      const testCases = [
        "://example.com",
        "https://",
        "http://",
        "https://example.com:abc",
        "https://example.com:99999", // Port out of range
        "https://example.com:-1", // Negative port
      ];

      testCases.forEach((url) => {
        const result = buildHttpHostname(url);
        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.error).toBe("Invalid URL");
        }
      });
    });

    it("rejects URLs that fail hostname validation", () => {
      const testCases = ["not-a-url"];

      testCases.forEach((url) => {
        const result = buildHttpHostname(url);
        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.error).toBe("Invalid hostname");
        }
      });
    });

    it("accepts URLs with trailing colon", () => {
      const result = buildHttpHostname("https://example.com:");
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.url.hostname).toBe("example.com");
        expect(result.url.port).toBe("");
      }
    });

    it("rejects URLs with invalid hostname formats", () => {
      const testCases = ["https://.com", "https://example..com", "https://example.com."];

      testCases.forEach((url) => {
        const result = buildHttpHostname(url);
        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.error).toBe("Invalid hostname");
        }
      });
    });

    it("rejects empty string", () => {
      const result = buildHttpHostname("");
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe("Invalid URL");
      }
    });

    it("rejects whitespace-only strings", () => {
      const testCases = [" ", "  ", "\t", "\n", " \t\n "];

      testCases.forEach((url) => {
        const result = buildHttpHostname(url);
        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.error).toBe("Invalid URL");
        }
      });
    });
  });

  describe("edge cases and boundary conditions", () => {
    it("handles URLs with very long hostnames", () => {
      const longHostname = "a".repeat(100) + ".com";
      const result = buildHttpHostname(`https://${longHostname}`);

      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.url.hostname).toBe(longHostname);
      }
    });

    it("handles URLs with maximum valid port numbers", () => {
      const testCases = [
        "https://example.com:65535", // Maximum valid port
        "https://example.com:1", // Minimum valid port
      ];

      testCases.forEach((url) => {
        const result = buildHttpHostname(url);
        expect(result.isValid).toBe(true);
      });
    });

    it("handles internationalized domain names", () => {
      const testCases = ["https://测试.com", "https://пример.рф", "https://münchen.de"];

      testCases.forEach((url) => {
        const result = buildHttpHostname(url);
        expect(result.isValid).toBe(true);
        if (result.isValid) {
          expect(result.url.hostname).toContain(".");
        }
      });
    });

    it("handles URLs with special characters in hostname", () => {
      const testCases = ["https://test-site.com", "https://test_site.com", "https://test123.com"];

      testCases.forEach((url) => {
        const result = buildHttpHostname(url);
        expect(result.isValid).toBe(true);
      });
    });
  });
});
