import type { ProfileFieldParser } from "./types";

const textParser = (key: string): ProfileFieldParser<string> => ({
  selection: { texts: [key] },
  parse: (records) => {
    const raw = records.texts?.[key];
    if (raw == null || raw === "") return null;
    return raw;
  },
});

export const ProfileDescriptionParser: ProfileFieldParser<string> = textParser("description");
export const ProfileWebsiteParser: ProfileFieldParser<string> = textParser("url");
