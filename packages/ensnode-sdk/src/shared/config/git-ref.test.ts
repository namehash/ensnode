import { describe, expect, it } from "vitest";

import type { GitEnvironment } from "./environments";
import { buildCommitRef } from "./git-ref";

describe("git-ref", () => {
  describe("buildCommitRef", () => {
    it("should return the commit reference for valid GIT_COMMIT", () => {
      const envWithCommit: GitEnvironment = {
        GIT_COMMIT: "1234567890abcdef1234567890abcdef12345678",
      };
      const commitRef = buildCommitRef(envWithCommit);
      expect(commitRef).toBe(envWithCommit.GIT_COMMIT);
    });

    it("should return undefined if GIT_COMMIT is not available", () => {
      const envWithoutCommit: GitEnvironment = {
        GIT_COMMIT: undefined,
      };
      const commitRef = buildCommitRef(envWithoutCommit);
      expect(commitRef).toBe(undefined);
    });

    it("should return undefined if GIT_COMMIT is empty", () => {
      const envWithEmptyCommit: GitEnvironment = {
        GIT_COMMIT: "",
      };
      const commitRef = buildCommitRef(envWithEmptyCommit);
      expect(commitRef).toBe(undefined);
    });

    it("should throw if GIT_COMMIT is invalid", () => {
      const envWithInvalidCommit: GitEnvironment = {
        GIT_COMMIT: "invalid_commit_hash",
      };
      expect(() => buildCommitRef(envWithInvalidCommit)).toThrow();
    });
  });
});
