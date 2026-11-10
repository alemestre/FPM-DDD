-- CreateEnum
CREATE TYPE "ProductUnit" AS ENUM ('KG', 'BOTTE', 'PIECE');

-- AlterTable
-- Existing rows get the default unit KG.
ALTER TABLE "Product" ADD COLUMN "unit" "ProductUnit" NOT NULL DEFAULT 'KG';
