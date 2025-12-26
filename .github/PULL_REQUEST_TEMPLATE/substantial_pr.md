# Substantial PR

> This template exists to reduce reviewer load and encourage engineering best practices. If it feels heavy, the PR is likely too large or insufficiently prepared.
>
> Use this template for PRs that change behavior, affect multiple consumers, introduce new concepts, or would hurt if they broke.
>
> Reviewers may block or close Substantial PRs with vague or incomplete responses without further justification.
>
> Reviewers may request that this PR be split if it is difficult to reason about as a single unit.

## Requested Reviewer Focus

<details>
<summary>Requested Reviewer Focus</summary>

- Where should reviewers spend the majority of their attention?
- What parts are most subtle, risky, or non-obvious?
- What feedback are you explicitly asking for?
- If you list "everything," explain why targeted review is not possible.
- Limit focus areas to 1–3 items.
- Avoid restating the change summary here.

</details>
<br>

## Problem & Motivation

<details>
<summary>Problem & Motivation</summary>

- Why does this change exist?
- Why is this change being made now instead of earlier or later?
- What breaks or is suboptimal without this PR?
- Link to related issues or discussions.
- Keep it clean and concise (aim for ≤5 bullets).

</details>
<br>

## What Changed (Concrete)

<details>
<summary>What Changed (Concrete)</summary>

- List the concrete behavioral or structural changes made by this PR.
- Keep it clean and concise.
- Prefer numbered bullets over prose.
- If this list exceeds ~5 items, consider splitting the PR.
- Each bullet should correspond to a distinct diff cluster.

</details>
<br>

## Design & Planning

<details>
<summary>Design & Planning</summary>

- Link to docs or design assets that existed *before* or *during* implementation.
- If no design or planning was required, explain why (e.g. mechanical refactor, prior approved pattern).
- List the most viable alternative(s) you considered and why they were rejected.
- If planning was lightweight, say so explicitly.

</details>
<br>

- Planning artifacts:
- Plans reviewed & approved by (only if formal review occurred):

## Self-Review

<details>
<summary>Self-Review</summary>

- Describe changes made **after** reviewing your own diff end-to-end.

</details>
<br>

- Bugs caught:
- Logic simplifications:
- Naming / terminology improvements:
- Unnecessary code removed (or explain why none was removed):

## Cross-Codebase Alignment

<details>
<summary>Cross-Codebase Alignment</summary>

- Cite the specific terms you searched for to identify related changes.
- Identify files, packages, or docs reviewed but not modified.
- Call out areas intentionally left unchanged and why.
- Focus on directly related domains and terminology, don't "boil the ocean" and unnecessarily expand scope.

</details>
<br>

- Cite the most relevant search terms (not exhaustive, usually <=5):
- Files reviewed but unchanged:
- Deferred alignments (with rationale):

## Downstream & Consumer Impact

<details>
<summary>Downstream & Consumer Impact</summary>

- How does this PR affect readers, callers, operators, or future maintainers?
- Cite specific terminology, narratives, or mental models that could increase cognitive load.
- Identify concrete changes made to reduce that load - Prefer pointing to diffs over describing intent.
- Reference specific files or diffs where applicable.

</details>
<br>

- Public APIs / interfaces affected:
- Docs updated (links):
- Naming decisions worth noting:

## Testing Evidence

<details>
<summary>Testing Evidence</summary>

- How was this tested locally and/or in CI?
- What important behavior is **not** tested and why?
- If this PR is wrong, what breaks first?

</details>
<br>

- Testing performed:
- Known gaps:
- What reviewers must reason about manually (and why):

## Scope Reductions

<details>
<summary>Scope Reductions</summary>

- What opportunities for future improvement were identified during the creation of this PR but are selected for separate future follow-up to avoid undesirable scope growth?
- Link to follow up issues.

</details>
<br>

- Follow up issues:
- Why were these deferred instead of included (tradeoffs considered)?

## Risk Analysis

<details>
<summary>Risk Analysis</summary>

- What assumptions does this PR make?
- Where is this most likely to fail?
- What is the blast radius if it does?

</details>
<br>

- Risk areas:
- Mitigations:
- Named primary owner if this breaks:

## Pre-Review Checklist (Blocking)

- [ ] I reviewed every line of this diff and understand it end-to-end
- [ ] I am prepared to defend this PR line-by-line in review
- [ ] I would be comfortable being the on-call owner for this change
- [ ] Relevant changesets are included (or explicitly not required)
