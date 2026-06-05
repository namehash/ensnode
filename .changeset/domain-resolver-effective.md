---
"ensapi": patch
---

**Omnigraph API:** Adds `DomainResolver.effective`, the Resolver that ENS Forward Resolution (ENSIP-10) lands on for a Domain — identified from indexed data by walking the name hierarchy within the Domain's Registry. Complements the existing `DomainResolver.assigned` (the Domain's directly-assigned Resolver).
