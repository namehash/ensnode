import {
  SETUP_PACKAGE_MANAGERS,
  SETUP_TAB_LABELS,
  type SetupPackageManager,
} from "@lib/examples/omnigraph/build-integration-snippets";

import type { StaticExampleTab, StaticExampleTabPanel } from "./tab-types";

export function buildSdkSetupTabs(input: {
  uid: string;
  prefix: "enssdk" | "enskit";
  setupSnippets: Record<SetupPackageManager, string>;
}): { tabs: StaticExampleTab[]; panels: StaticExampleTabPanel[] } {
  const tabs: StaticExampleTab[] = SETUP_PACKAGE_MANAGERS.map((pm) => ({
    id: `${input.uid}-tab-setup-${input.prefix}-${pm}`,
    label: SETUP_TAB_LABELS[pm],
    icon: pm,
  }));

  const panels: StaticExampleTabPanel[] = SETUP_PACKAGE_MANAGERS.map((pm, i) => ({
    id: `${input.uid}-tab-setup-${input.prefix}-${pm}`,
    code: input.setupSnippets[pm],
    lang: "bash",
    visible: i === 0,
  }));

  return { tabs, panels };
}
