import { join } from "node:path";

export const ENSRAINBOW_DEFAULT_PORT = 3223;

export const getDefaultDataDir = () => join(process.cwd(), "data");
