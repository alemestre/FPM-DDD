# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# Project: FPM e-commerce App

## Project Rules

Follow the guidelines defined in `.claude/rules/`:

- `architecture.md`: DDD principles, bounded contexts and architectural boundaries.
- `prisma.md`: Prisma ORM and persistence conventions.
- `zod-validation.md`: validation and schema conventions.
- `typescript-nodejs.md`: TypeScript and Node.js coding conventions.

## Project Structure

- apps/shop-api : backend api
- apps/angular-shop : Angular SSR storefront (still the generated starter)
- libs/contracts : HTTP response contracts (`@fpm/contracts`) shared by both apps. Holds the Zod
  schemas and `*ResponseDto` types only. Mappers stay in shop-api because they import domain entities.
  In angular-shop, use `import type` so Zod stays out of the browser bundle.

## Shop Api

- Nest js (v 11.0.0)
- Prisma ORM
- Use Zod validation
- The backend follows Domain-Driven Design (DDD).

## Commands

```sh
npm run serve:shop-api                                      # API on :3000, under /api
npm run test:all                                            # projects tagged scope:test, with coverage
npx nx test shop-api                                        # all shop-api tests
npx nx test shop-api --testPathPatterns=stock.value-object  # single test file
npx nx lint shop-api
npx nx build shop-api
```

Run Prisma from `apps/shop-api`. The config has a non-default name, so always pass it:

```sh
npx prisma generate --config prisma7.config.ts              # required on a fresh clone
npx prisma migrate dev --config prisma7.config.ts
```

## Architecture

Bounded contexts are in `apps/shop-api/src/app/{product,producer,category}`, each with
`domain/`, `application/`, `infrastructure/` and `interface/http/`. Copy this flow for new features:

- **Request path:** a controller receives a Zod DTO, calls one `*UseCase.execute()`, then maps
  the entity with a response mapper such as `toProductResponse`.
- **Responses:** `ApiResponseInterceptor` wraps every successful result as
  `{ success: true, data }` (`ApiResponseDto`), so controllers return the bare DTO. Empty
  204 responses stay empty, and errors keep the format set by the exception filters.
- **Use cases:** one class per file and per action, not a grouped `*.service.ts`.
- **Repository ports:** abstract classes extending `GenericEntityRepository<T>`, so they can be
  Nest DI tokens. Bind them in the module:
  `{ provide: ProductRepository, useClass: PrismaProductRepository }`.
- **Validation:** DTOs check request shape, while entities and value objects enforce business rules.
- **Errors:** `DomainValidationError` and its subclasses become HTTP 400 through a global filter.
  Other domain errors need their own mapping.
- **Prisma:** `PrismaModule` is global, and the client is generated into `src/generated/prisma`
  (gitignored).
- **Tests:** repository specs use a mocked Prisma client, so they don't need a database.

## Before coding

- Explore the existing implementation before creating new files.
- Reuse existing patterns from the same bounded context.
- Prefer extending existing modules over duplicating code.

## Testing

- Use Jest for shop-api.
- Run tests through Nx.
- Run the full test suite with `npm run test:all`.
- Write unit tests for domain logic and application use cases.
- Write integration tests for infrastructure implementations.
- Test business rules, edge cases and error scenarios.
- Never remove or weaken tests just to make the test suite pass.
