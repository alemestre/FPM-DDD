---
paths:
  - "apps/shop-api/**/*.ts"
  - "apps/shop-api/**/*.tsx"
---

# TypeScript and Node.js

Prefer explicit, maintainable TypeScript. Do not use `any`. Use `unknown` at untrusted boundaries, then narrow.

## Naming

- Classes, types, enums: PascalCase.
- Variables, functions, methods: camelCase.
- Files and directories: kebab-case.
- Constants and environment keys: UPPER_SNAKE_CASE.
- Use descriptive names that communicate intent.
- Prefer verb-based names for functions and methods.
- Use boolean prefixes (`is`, `has`, `can`, `should`) for predicates.

## Types

- Prefer `import type` when a symbol is type-only.
- Mark immutable fields and properties `readonly` where appropriate.
- Prefer `z.infer<typeof schema>` over hand-written DTO types when Zod already describes the shape.
- Do not use `@ts-ignore`. Prefer `@ts-expect-error` with a one-line reason only when unavoidable.
- Allow TypeScript inference for simple local and private functions.
- Avoid unnecessary type assertions.

## Functions and Errors

- Prefer small, focused functions with a single responsibility.
- Prefer pure functions in the domain layer.
- Keep I/O and infrastructure concerns outside the domain layer.
- Never silently swallow errors.
- Throw meaningful typed errors when appropriate.
- Preserve the original error using `{ cause }` when wrapping errors.
- Log errors only at the appropriate application boundary.
- Avoid logging and rethrowing the same error at every layer.
- Never introduce logging dependencies into the domain layer.

## Node.js

- Treat process input (HTTP, queues, environment variables, files) as untrusted.
- Validate external inputs with Zod before use.
- Keep secrets in environment variables, never in source code.
- Validate environment variables with a Zod schema at startup.
- Prefer `Promise.all` for independent asynchronous operations.
- Avoid sequential awaits when operations are independent.
- Use bounded concurrency for large collections.
- Consider transaction boundaries and resource constraints when running operations concurrently.
- Preserve execution order when business rules require it.


## Node.js

- Treat process input (HTTP, queues, env, files) as untrusted. Validate with Zod before use.
- Prefer `Promise.all` for independent async work. Do not await in a loop unless order or rate limits require it.
- Keep secrets in env, never in source.
