export function buildNodePlaygroundTsconfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        lib: ["ESNext", "DOM", "DOM.Iterable"],
        types: ["node"],
      },
      include: ["src"],
    },
    null,
    2,
  );
}
