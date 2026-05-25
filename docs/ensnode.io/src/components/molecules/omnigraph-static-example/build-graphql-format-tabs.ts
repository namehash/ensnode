import { buildOmnigraphCurlExample } from "@lib/examples/omnigraph/docs-utils";

import type { StaticExampleTab, StaticExampleTabPanel } from "./tab-types";

export function buildGraphqlFormatTabs(input: {
  uid: string;
  query: string;
  variablesJson: string;
  variablesObject: Record<string, unknown>;
  responseJson: string | null;
  connectionBaseUrl: string;
  hideCurl?: boolean;
}): { tabs: StaticExampleTab[]; panels: StaticExampleTabPanel[] } {
  const tabIds = {
    vars: `${input.uid}-tab-vars`,
    resp: `${input.uid}-tab-resp`,
    curl: `${input.uid}-tab-curl`,
  } as const;

  const curlExample =
    !input.hideCurl &&
    buildOmnigraphCurlExample({
      connectionBaseUrl: input.connectionBaseUrl,
      query: input.query,
      variables: input.variablesObject,
    });

  const tabs: StaticExampleTab[] = [
    { id: tabIds.vars, label: "Variables", icon: "seti:json" },
    ...(input.responseJson ? [{ id: tabIds.resp, label: "Response", icon: "seti:json" }] : []),
    ...(curlExample ? [{ id: tabIds.curl, label: "Curl", icon: "window" }] : []),
  ];

  const panels: StaticExampleTabPanel[] = [
    {
      id: tabIds.vars,
      code: input.variablesJson,
      lang: "json",
      maxHeight: "min(38vh,19rem)",
      visible: true,
    },
    ...(input.responseJson
      ? [
          {
            id: tabIds.resp,
            code: input.responseJson,
            lang: "json",
            maxHeight: "min(50vh,28rem)",
            visible: false,
          },
        ]
      : []),
    ...(curlExample
      ? [
          {
            id: tabIds.curl,
            code: curlExample,
            lang: "bash",
            maxHeight: "min(50vh,28rem)",
            visible: false,
          },
        ]
      : []),
  ];

  return { tabs, panels };
}
