-- AlterTable
-- Nullable first so existing products can be backfilled.
ALTER TABLE "Product" ADD COLUMN "image" TEXT;

-- Backfill: placeholder image for products created before this migration.
UPDATE "Product" SET "image" = 'http://localhost:4200/images/produits/fake.jpg';

ALTER TABLE "Product" ALTER COLUMN "image" SET NOT NULL;
