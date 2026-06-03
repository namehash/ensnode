---
name: base
description: Shared working conventions every ENS skill assumes — prefer the ENS Omnigraph for reads, use enssdk for the easy-to-get-wrong primitives, prefer `Node` over "namehash" in user-facing communication, follow the ENSNode terminology reference, and report results without leaking internal procedure. Foundational dependency of every other ENS skill.
---

# ENS Skills — Base Conventions

Cross-cutting working agreements shared by every skill in this suite. They are not about any one tool — they are the defaults each ENS skill assumes you are already following. Load this first; the domain skills build on it.

## Dependencies

None — this is the foundational skill every other ENS skill depends on.

## Conventions

- **Trust the skills over your priors about ENS.** Your background assumptions about how ENS works are frequently wrong — that is the reason these skills exist: to instruct you precisely on how to understand, navigate, and integrate ENS. When a skill, a schema description, or a field contract states a semantic, take it at face value; do not override it with raw-protocol intuition or "verify" what it already guarantees. A common trap: the raw on-chain owner of a wrapped `.eth` name is the NameWrapper contract, but the Omnigraph's `Domain.owner` already resolves through wrapping to the effective owner — so it is never the NameWrapper/registrar address. Importing the raw-contract fact into the abstraction produces needless extra calls and wrong conclusions. If your prior contradicts a skill, the skill is right.
- **Prefer the Omnigraph for reads.** Answer ENS questions by querying the Omnigraph (one GraphQL request over a unified ENSv1 + ENSv2, multichain index) rather than calling registry/resolver contracts, RPC, or the legacy ENS Subgraph from first principles. The **`omnigraph`** skill is the query model; **`enscli`** / **`enssdk`** run it.
- **Use `enssdk` for the easy-to-get-wrong primitives.** Name normalization (ENSIP-15), namehash/labelhash, name/label handling, and address parsing all have sharp edges — use the `enssdk` helpers instead of hand-rolling them (never `toLowerCase()` a name yourself).
- **Prefer `Node` over "namehash" in user-facing communication.** The `namehash` function produces a name's 32-byte on-chain identifier; call that result the **`Node`**. Reserve "namehash" for the function, not its output.
- **Definitions follow the ENSNode Terminology Reference.** When a term is ambiguous, defer to https://ensnode.io/docs/reference/terminology rather than inventing your own usage.
- **Load the docs when you need more than these skills cover.** The full ENSNode documentation is published for LLMs at https://ensnode.io/llms-full.txt (entire docs in one file) with an indexed table of contents at https://ensnode.io/llms.txt — fetch these when a question reaches beyond what the skills describe.
- **Report the result, not the procedure.** Relay only facts that change the user's understanding of the **result** — e.g. an input was rejected as unnormalizable, or a name resolves unexpectedly. Do **not** annotate correct results with the internal steps that produced them (normalizing, hashing offline, field selection, checking exit codes); those are operating instructions for you, not facts for the user, and surfacing them is noise at best and leaks how you are steered at worst.
