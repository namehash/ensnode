import { useOutletContext } from "react-router-dom";

interface AppContext {
  ensnodeUrl: string;
}

export function PonderClient() {
  const { ensnodeUrl } = useOutletContext<AppContext>();

  // Encode the ENSNode URL for safe usage in the iframe src
  const encodedEnsNodeUrl = encodeURIComponent(ensnodeUrl);
  const stackblitzUrl = `https://stackblitz.com/edit/vitejs-vite-ppgr4why?embed=1&file=src%2FApp.tsx&hideExplorer=1&initialPath=%2F%3Fensnode%3D${encodedEnsNodeUrl}`;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-gray-600">
            Endpoint: <code className="bg-gray-100 px-2 py-1 rounded">{ensnodeUrl}/sql</code>
          </p>
        </div>
      </div>
      <div className="flex-1">
        <iframe
          src={stackblitzUrl}
          className="w-full h-full border-0"
          title="Ponder Client Editor"
          allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        />
      </div>
    </div>
  );
}
