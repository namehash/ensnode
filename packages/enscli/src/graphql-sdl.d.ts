// Ambient declaration for importing .graphql SDL files as strings (bundled via esbuild's text loader).
declare module "*.graphql" {
  const content: string;
  export default content;
}
