import { Name } from "./types";

export const getNameHierarchy = (name: Name): Name[] =>
  name.split(".").map((_, i, labels) => labels.slice(i).join("."));
