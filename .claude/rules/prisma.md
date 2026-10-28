---
paths:
  - "**/*.ts"
  - "**/*.prisma"
---

# Prisma

Prisma is the persistence adapter. Prisma models are not domain entities. Do not import `PrismaClient` types into domain or application use cases except through repository ports.

## Layout

- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrate` — never `db push` for shared or production databases
- Client access: one module in infrastructure that constructs `PrismaClient`
- Mapping: repository implementations convert Prisma records to domain types

## Repositories

```typescript
// domain port
export interface OrderRepository {
  getById(id: OrderId): Promise<Order | null>;
  save(order: Order): Promise<void>;
}

// infrastructure adapter maps Prisma <-> Order
```

- Put query details (`include`, `select`, `where`) only in infrastructure.
- Prefer explicit `select` / `include`. Do not return raw Prisma rows to HTTP handlers.
- Use `prisma.$transaction` for one use case that writes several aggregates or tables.

## Data safety

- Validate JSON columns and external payloads with Zod after reading them.
- Do not spread Prisma update objects from request bodies. Map fields explicitly.
- Keep generated client usage behind the adapter so the domain stays persistence-agnostic.
