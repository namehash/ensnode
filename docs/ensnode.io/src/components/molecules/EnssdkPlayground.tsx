import CodePlayground from "./CodePlayground";

interface CodePlaygroundProps {
  title: string;
  description?: string;
  fileContent: string;
  height?: number;
  terminalHeight?: number;
}

export default function EnssdkPlayground({
  title,
  description,
  fileContent,
  height,
  terminalHeight,
}: CodePlaygroundProps) {
  return (
    <CodePlayground
      title={title}
      description={description}
      files={{ "index.ts": fileContent }}
      dependencies={{ "@ensnode/ensnode-sdk": "latest" }}
      height={height}
      terminalHeight={terminalHeight}
    />
  );
}
