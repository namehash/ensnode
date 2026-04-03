import { buildSchema } from "graphql";

import { sdl } from "./generated/schema-sdl";

export const schema = buildSchema(sdl);
