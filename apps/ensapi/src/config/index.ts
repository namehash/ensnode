import { buildConfigFromEnvironment } from "@/config/config.schema";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });

export default buildConfigFromEnvironment(process.env);
