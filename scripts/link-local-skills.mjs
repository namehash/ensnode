// Mirrors local skills from .agents/skills (canonical, committed) into
// .claude/skills as symlinks, so Claude Code discovers them. npm-* entries are
// managed by skills-npm and skipped. Runs via the root `prepare` script.
import { lstatSync, mkdirSync, readdirSync, readlinkSync, symlinkSync, unlinkSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const source = join(root, ".agents", "skills");
const target = join(root, ".claude", "skills");

mkdirSync(target, { recursive: true });

const isLocalSkill = (name) => !name.startsWith("npm-") && !name.startsWith(".");
const localSkills = readdirSync(source).filter(isLocalSkill);

// drop symlinks in .claude/skills that point into .agents/skills whose canonical skill no longer exists
for (const name of readdirSync(target)) {
  if (!isLocalSkill(name)) continue;
  const path = join(target, name);
  if (!lstatSync(path).isSymbolicLink()) continue;
  const linksIntoSource = readlinkSync(path).includes(".agents/skills");
  if (linksIntoSource && !localSkills.includes(name)) unlinkSync(path);
}

for (const name of localSkills) {
  const path = join(target, name);
  const desired = relative(target, join(source, name));
  try {
    if (readlinkSync(path) === desired) continue;
    unlinkSync(path);
  } catch {
    // missing or not a symlink: a real directory here is a personal skill — leave it
    let stat;
    try {
      stat = lstatSync(path);
    } catch {
      stat = null; // nothing here; symlinkSync below will create it
    }
    if (stat?.isDirectory()) continue;
    // a regular file here would make symlinkSync throw EEXIST — remove it first
    // (let an unlink failure escape rather than mask it as a downstream EEXIST)
    if (stat) unlinkSync(path);
  }
  symlinkSync(desired, path);
  console.log(`linked .claude/skills/${name} -> ${desired}`);
}
