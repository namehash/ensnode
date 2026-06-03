import type { Email } from "enssdk";

import { makeEmailSchema } from "@ensnode/ensnode-sdk/internal";

import type { ProfileFieldInterpreter } from "./types";

const profileEmailSchema = makeEmailSchema("email text record");

const textInterpreter = (key: string): ProfileFieldInterpreter<string> => ({
  selection: { texts: [key] },
  interpret: (result) => {
    const raw = result.records.texts?.[key];
    if (raw == null || raw === "") return null;
    return raw;
  },
});

export const ProfileDescriptionInterpreter: ProfileFieldInterpreter<string> =
  textInterpreter("description");

export const ProfileEmailInterpreter: ProfileFieldInterpreter<Email> = {
  selection: { texts: ["email"] },
  interpret: (result) => {
    const raw = result.records.texts?.email?.trim();
    if (!raw) return null;
    const parsed = profileEmailSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  },
};

const httpUrlInterpreter = (key: string): ProfileFieldInterpreter<string> => ({
  selection: { texts: [key] },
  interpret: (result) => {
    const trimmed = result.records.texts?.[key]?.trim();
    if (!trimmed) return null;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return null;
    }

    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return null;
    }
  },
});

export const ProfileWebsiteInterpreter: ProfileFieldInterpreter<string> = httpUrlInterpreter("url");
