import type { OmnigraphScalars } from "enssdk/omnigraph";
import { describe, expectTypeOf, it } from "vitest";

import type { BuilderScalars } from "./builder";

type BuilderScalarNames = Record<keyof BuilderScalars, unknown>;
type OmnigraphScalarNames = Record<keyof OmnigraphScalars, unknown>;

describe("BuilderScalars", () => {
  it("defines the same scalar names as OmnigraphScalars from enssdk", () => {
    expectTypeOf<BuilderScalarNames>().toEqualTypeOf<OmnigraphScalarNames>();
  });
});
