import { describe, expect, expectTypeOf, it } from "vitest";
import { filterSchemaByPrefix } from "../src/lib/filter-schema-by-prefix";

describe("filterSchemaByPrefix", () => {
  it("filters schema by prefix and removes prefix from keys", () => {
    const schema = {
      plugin_users: "userTable",
      plugin_posts: "postTable",
      other_table: "otherTable",
      plugin_comments: "commentTable",
    } as const;

    const filtered = filterSchemaByPrefix("plugin_", schema);

    expect(filtered).toEqual({
      users: "userTable",
      posts: "postTable",
      comments: "commentTable",
    });
  });

  it("returns empty object when no keys match prefix", () => {
    const schema = {
      users: "userTable",
      posts: "postTable",
    } as const;

    const filtered = filterSchemaByPrefix("plugin_", schema);

    expect(filtered).toEqual({});
  });

  it("preserves original value types", () => {
    const schema = {
      app_config: { setting: "value" },
      app_data: [1, 2, 3],
      other_item: "ignored",
    } as const;

    const filtered = filterSchemaByPrefix("app_", schema);

    expect(filtered.config).toEqual({ setting: "value" });
    expect(filtered.data).toEqual([1, 2, 3]);

    expectTypeOf(filtered.config).toEqualTypeOf<{ readonly setting: "value" }>();
    expectTypeOf(filtered.data).toEqualTypeOf<readonly [1, 2, 3]>();
  });
});
