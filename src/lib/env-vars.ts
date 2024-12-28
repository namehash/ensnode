import convict from "convict";
import { configDotenv } from "dotenv";

configDotenv();

convict.addFormat({
  name: "lowercase-string",
  validate: function (val) {
    if (typeof val !== "string") {
      throw new Error("must be a string");
    }
  },
  coerce: function (val) {
    return val.toLowerCase();
  },
});

export function loadEnvVars<T>(schema: convict.Config<T>) {
  schema.validate({ allowed: "strict" });

  return schema.getProperties();
}
