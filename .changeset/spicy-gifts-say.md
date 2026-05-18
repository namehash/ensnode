---
"ensadmin": patch
---

Validate name input on the Explore Names page (`/name`). The form normalizes user input before navigating and displays inline errors for unnormalizable names or names with encoded labelhashes (resolution support is in progress). Query params on the detail page are validated against `InterpretedName`.

Unnormalized names and names with encoded labelhashes each show a dedicated error instead of falling through to a broken detail page.

An empty `?name=` shows the form rather than the detail page.
