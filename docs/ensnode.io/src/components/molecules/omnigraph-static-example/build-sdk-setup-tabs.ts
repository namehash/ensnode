import {
  SETUP_PACKAGE_MANAGERS,
  SETUP_TAB_LABELS,
  type SetupPackageManager,
} from "@lib/omnigraph-examples/build-integration-snippets";

import type { StaticExampleTab, StaticExampleTabPanel } from "./tab-types";

export function buildSdkSetupTabs(input: {
  uid: string;
  prefix: "enssdk" | "enskit";
  setupSnippets: Record<SetupPackageManager, string>;
  responseJson: string | null;
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
    maxHeight: "min(38vh,19rem)",
    visible: i === 0,
  }));

  if (input.responseJson) {
    tabs.push({
      id: `${input.uid}-tab-output-${input.prefix}`,
      label: "Output",
      icon: "seti:json",
    });
    panels.push({
      id: `${input.uid}-tab-output-${input.prefix}`,
      code: input.responseJson,
      lang: "json",
      maxHeight: "min(50vh,28rem)",
      visible: false,
    });
  }

  return { tabs, panels };
}
