---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# Zod validation

Define the schema first. Create ClassDTO from the schema and use it to type the incoming data in controller. We're using ZodValidationPipe global pipes to validate the incoming data.

```typescript
export const createOrderInputSchema = z.object({
  customerId: z.string().uuid(),
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
});

export class CreateCategoryDTO extends createZodDto(CreateCategorySchema) {}

@Controller("categories")
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  create(@Body() { label }: CreateCategoryDTO) {
    return this.categoryService.createCategory(label);
  }}

```

## Where to parse

- **In:** workers, CLI, and env bootstrap — `schema.parse` or `schema.safeParse`.
- **Out:** map domain results to response schemas before serialization.
- **Not in:** domain entities and value objects as a substitute for invariants. Domain rules stay in the domain.

Use `safeParse` when the caller must return a 4xx or equivalent. Use `parse` when invalid data is a programmer error.

```typescript
const parsed = createOrderInputSchema.safeParse(body);
if (!parsed.success) {
  throw new ValidationError(parsed.error);
}
```

## Rules

- Do not hand-write interfaces that duplicate a Zod schema.
- Do not trust Prisma `Json` fields, `unknown` payloads, or `process.env` without a schema.
- Colocate schemas with the boundary they protect (`*-input.schema.ts`, `env.schema.ts`).
- Use `.brand()`, `.refine()`, or value objects for domain primitives (ids, money, SKUs).
