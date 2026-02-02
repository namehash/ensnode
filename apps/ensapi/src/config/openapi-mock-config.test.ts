import { describe, expect, it } from "vitest";

import { ENSApi_DEFAULT_PORT } from "@/config/defaults";
import { buildOpenApiMockConfig } from "@/config/openapi-mock-config";

describe("buildOpenApiMockConfig", () => {
  it("uses the default port when no port is provided", () => {
    const config = buildOpenApiMockConfig();

    expect(config.port).toBe(ENSApi_DEFAULT_PORT);
  });

  it("uses the provided port when specified", () => {
    const config = buildOpenApiMockConfig("5000");

    expect(config.port).toBe("5000");
  });

  it("has consistent namespace between top-level and ensIndexerPublicConfig", () => {
    const config = buildOpenApiMockConfig();

    expect(config.namespace).toBe(config.ensIndexerPublicConfig.namespace);
  });

  it("has consistent databaseSchemaName between top-level and ensIndexerPublicConfig", () => {
    const config = buildOpenApiMockConfig();

    expect(config.databaseSchemaName).toBe(config.ensIndexerPublicConfig.databaseSchemaName);
  });
});
