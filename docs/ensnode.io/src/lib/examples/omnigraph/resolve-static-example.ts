import { ENSADMIN_URL } from "astro:env/client";
import { getOmnigraphExampleById } from "@data/omnigraph-examples/examples";
import { getDocsOmnigraphNamespaceConfig } from "@lib/examples/omnigraph/constants";
import {
  buildEnskitSetupSnippets,
  buildEnskitSnippet,
  buildEnssdkSetupSnippets,
  buildEnssdkSnippet,
  type SetupPackageManager,
} from "@lib/examples/omnigraph/build-integration-snippets";
import {
  buildEnsAdminOmnigraphUrl,
  buildOmnigraphCurlExample,
  getHostedEnsNodeInstanceDocUrl,
  stringifyJsonForDocs,
} from "@lib/examples/omnigraph/docs-utils";

export interface OmnigraphStaticExampleData {
  exampleId: string;
  uid: string;
  query: string;
  variablesJson: string;
  responseJson: string | null;
  hostedInstanceDocUrl: string;
  hostedInstanceLabel: string;
  responseSourceLabel: string;
  adminUrl: string;
  enssdkSnippet: string;
  enskitSnippet: string;
  enssdkSetupSnippets: Record<SetupPackageManager, string>;
  enskitSetupSnippets: Record<SetupPackageManager, string>;
  curlExample: string;
}

/** Load snapshot example data and derived integration snippets for static docs panels. */
export function resolveOmnigraphStaticExample(exampleId: string): OmnigraphStaticExampleData {
  const example = getOmnigraphExampleById(exampleId);
  const uid = exampleId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const responseSource = getDocsOmnigraphNamespaceConfig(example.namespace);

  return {
    exampleId,
    uid,
    query: example.query,
    variablesJson: stringifyJsonForDocs(example.variables),
    responseJson: example.response ? stringifyJsonForDocs(example.response) : null,
    hostedInstanceDocUrl: getHostedEnsNodeInstanceDocUrl(responseSource.hostedInstanceAnchor),
    hostedInstanceLabel: responseSource.hostedInstanceLabel,
    responseSourceLabel: responseSource.hostedInstanceLabel,
    adminUrl: buildEnsAdminOmnigraphUrl({
      ensadminBaseUrl: ENSADMIN_URL,
      query: example.query,
      connection: example.connection,
      variables: example.variables,
    }),
    enssdkSnippet: buildEnssdkSnippet({ query: example.query, variables: example.variables }),
    enskitSnippet: buildEnskitSnippet({ query: example.query, variables: example.variables }),
    enssdkSetupSnippets: buildEnssdkSetupSnippets(),
    enskitSetupSnippets: buildEnskitSetupSnippets(),
    curlExample: buildOmnigraphCurlExample({
      connectionBaseUrl: example.connection,
      query: example.query,
      variables: example.variables,
    }),
  };
}
