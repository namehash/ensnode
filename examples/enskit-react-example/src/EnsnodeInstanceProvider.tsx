import { OmnigraphProvider } from "enskit/react/omnigraph";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "react-router";

import { createOmnigraphEnsNodeClient, type OmnigraphEnsNodeClient } from "./client";

import {
  DEFAULT_ENSNODE_INSTANCE,
  type EnsnodeInstance,
  type EnsnodeInstanceConstants,
  ENSNODE_INSTANCE_STORAGE_KEY,
  ENSNODE_INSTANCES,
  getEnsnodeInstanceById,
} from "./instances";

const envEnsnodeUrl = import.meta.env.VITE_ENSNODE_URL as string | undefined;

interface EnsnodeInstanceContextValue {
  instance: EnsnodeInstance;
  constants: EnsnodeInstanceConstants;
  ensnodeUrl: string;
  client: OmnigraphEnsNodeClient;
  setInstanceId: (id: string) => void;
  instanceSelectionDisabled: boolean;
}

const EnsnodeInstanceContext = createContext<EnsnodeInstanceContextValue | null>(null);

function resolveInstanceId(searchParams: URLSearchParams): string {
  const fromUrl = searchParams.get("instance");
  if (fromUrl && getEnsnodeInstanceById(fromUrl)) return fromUrl;

  try {
    const fromStorage = localStorage.getItem(ENSNODE_INSTANCE_STORAGE_KEY);
    if (fromStorage && getEnsnodeInstanceById(fromStorage)) return fromStorage;
  } catch {
    // localStorage may be unavailable
  }

  return DEFAULT_ENSNODE_INSTANCE.id;
}

export function EnsnodeInstanceProvider({ children }: PropsWithChildren) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [instanceId, setInstanceIdState] = useState(() => resolveInstanceId(searchParams));

  const instance = getEnsnodeInstanceById(instanceId) ?? DEFAULT_ENSNODE_INSTANCE;
  const instanceSelectionDisabled = Boolean(envEnsnodeUrl);
  const ensnodeUrl = envEnsnodeUrl ?? instance.url;

  const client = useMemo(() => createOmnigraphEnsNodeClient(ensnodeUrl), [ensnodeUrl]);

  const setInstanceId = useCallback(
    (id: string) => {
      if (!getEnsnodeInstanceById(id) || instanceSelectionDisabled) return;

      setInstanceIdState(id);
      try {
        localStorage.setItem(ENSNODE_INSTANCE_STORAGE_KEY, id);
      } catch {
        // localStorage may be unavailable
      }

      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id === DEFAULT_ENSNODE_INSTANCE.id) next.delete("instance");
          else next.set("instance", id);
          return next;
        },
        { replace: true },
      );
    },
    [instanceSelectionDisabled, setSearchParams],
  );

  const value = useMemo(
    () => ({
      instance,
      constants: instance.constants,
      ensnodeUrl,
      client,
      setInstanceId,
      instanceSelectionDisabled,
    }),
    [instance, ensnodeUrl, client, setInstanceId, instanceSelectionDisabled],
  );

  return (
    <EnsnodeInstanceContext.Provider value={value}>
      <OmnigraphProvider client={client} key={ensnodeUrl}>
        {children}
      </OmnigraphProvider>
    </EnsnodeInstanceContext.Provider>
  );
}

export function useEnsnodeInstance(): EnsnodeInstanceContextValue {
  const value = useContext(EnsnodeInstanceContext);
  if (!value) {
    throw new Error("useEnsnodeInstance must be used within EnsnodeInstanceProvider");
  }
  return value;
}

export function InstanceSelector() {
  const { instance, setInstanceId, instanceSelectionDisabled } = useEnsnodeInstance();

  return (
    <label>
      ENSNode instance:{" "}
      <select
        value={instance.id}
        disabled={instanceSelectionDisabled}
        onChange={(event) => setInstanceId(event.target.value)}
      >
        {ENSNODE_INSTANCES.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
