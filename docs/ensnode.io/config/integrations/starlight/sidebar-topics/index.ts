import type { StarlightSidebarTopicsUserConfig } from "starlight-sidebar-topics";

import { integrateSidebarTopic } from "./integrate";
import { servicesSidebarTopic } from "./services";
import { referenceSidebarTopic } from "./reference";
import { selfHostSidebarTopic } from "./self-host";

export const starlightSidebarTopicsConfig = [
  integrateSidebarTopic,
  selfHostSidebarTopic,
  referenceSidebarTopic,
  servicesSidebarTopic,
] satisfies StarlightSidebarTopicsUserConfig;
