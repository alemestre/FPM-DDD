-- AlterTable
-- Optional column: existing products (KG, BOTTE, PIECE only) have no quantity (NULL).
ALTER TABLE "Product" ADD COLUMN "quantity" DECIMAL(10,3);
