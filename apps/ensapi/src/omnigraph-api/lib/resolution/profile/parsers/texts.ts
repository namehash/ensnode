import type { Email } from "enssdk";

import { makeEmailSchema } from "@ensnode/ensnode-sdk/internal";

import type { ProfileFieldParser } from "./types";

const profileEmailSchema = makeEmailSchema("email text record");

const textParser = (key: string): ProfileFieldParser<string> => ({
  selection: { texts: [key] },
  parse: (result) => {
    const raw = result.records.texts?.[key];
    if (raw == null || raw === "") return null;
    return raw;
  },
});

export const ProfileDescriptionParser: ProfileFieldParser<string> = textParser("description");

export const ProfileEmailParser: ProfileFieldParser<Email> = {
  selection: { texts: ["email"] },
  parse: (result) => {
    const raw = result.records.texts?.email?.trim();
    if (!raw) return null;
    const parsed = profileEmailSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  },
};

const urlParser = (key: string): ProfileFieldParser<string> => ({
  selection: { texts: [key] },
  parse: (result) => {
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

export const ProfileWebsiteParser: ProfileFieldParser<string> = urlParser("url");
