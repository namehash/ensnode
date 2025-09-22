# Radix-ui components usage instruction

All components from `@/components/radix-ui` are direct imports from the [Radix UI component library](https://www.radix-ui.com/primitives/docs/overview/introduction) and shouldn't be directly modified
unless there is a very special reason for it. 

If we want to apply any changes to the behavior of such component across our app, a `"higher order" component` should be created. It would adapt the UI to our new needs through composition and addition of necessary logic, without touching the base component.

If, for any special reason, a direct change to the radix-originated base component ,both the reason and the change have to be documented in this file in the [Base component changes](#base-component-changes) subsection below.

## Base component changes

| Component name    | Reason for the change | Change description     |
|-------------------|-----------------------|------------------------|
| example-component | example-reason...     | example-description... |