import type { StarlightSidebarTopicsUserConfig } from "starlight-sidebar-topics";

import { hostedInstancesSidebarTopic } from "./hosted-instances";
import { integrateSidebarTopic } from "./integrate";
import { servicesSidebarTopic } from "./services";
import { referenceSidebarTopic } from "./reference";
import { selfHostSidebarTopic } from "./self-host";

export const starlightSidebarTopicsConfig = [
  integrateSidebarTopic,
  hostedInstancesSidebarTopic,
  selfHostSidebarTopic,
  servicesSidebarTopic,
  referenceSidebarTopic,
] satisfies StarlightSidebarTopicsUserConfig;
