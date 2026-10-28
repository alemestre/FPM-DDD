# Domain-Driven Design

Organize code by bounded context, then by layer. Speak the ubiquitous language in names, types, and tests.

## Layers

| Layer | Allowed to depend on | Contains |
| --- | --- | --- |
| Domain | nothing outside itself | entities, value objects, aggregates, domain events, repository ports |
| Application | domain | use cases, transaction boundaries, orchestration |
| Infrastructure | application ports, domain | Prisma, HTTP clients, Zod at I/O edges |
| Presentation | application | controllers, workers, CLI |

Dependencies point inward. Domain must not import Nest, Prisma, or HTTP types.

## Tactical rules

- **Entity:** identity (`id`) plus invariants. Behavior lives on the entity, not only in services.
- **Value object:** equality by value; immutable; no identity (money, SKU, email).
- **Aggregate:** one consistency boundary and one aggregate root. Persist and load the whole aggregate.
- **Domain event:** facts that already happened (`OrderPlaced`). Raise from the aggregate; publish from application/infrastructure.
- **Repository:** interface in domain, Prisma implementation in infrastructure.

```typescript
// ❌ anemic: use case mutates fields
order.status = 'paid';

// ✅ invariant on the aggregate
order.markPaid(clock.now());
```

## Boundaries

- One Nx package (or module) per bounded context when the context has its own model.
- Do not share Prisma models or Zod HTTP schemas as the domain model across contexts. Share only explicit contracts.
- Application services orchestrate; they do not become a dumping ground for domain rules.
