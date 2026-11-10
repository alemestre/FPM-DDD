-- CreateEnum
CREATE TYPE "QuantityUnit" AS ENUM ('pcs', 'g', 'ml', 'kg', 'l');

-- AlterTable
-- Optional column: existing products have no quantity unit (NULL).
ALTER TABLE "Product" ADD COLUMN "quantityUnit" "QuantityUnit";
