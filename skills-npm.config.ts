import { defineConfig } from "skills-npm";

export default defineConfig({
  // .agents/skills (universal) + .claude/skills only
  agents: ["universal", "claude-code"],
  yes: true,
});
