-- Sale unit and content of a product.
-- * ProductUnit: CONDITIONNEMENT is split into DOUZAINE (12 pcs) and LOT; DOUZAINE is new.
-- * contentQuantity + quantityUnit become contentItemCount × (contentAmount contentUnit):
--     12 pcs  -> 12 × (no size)
--     500 g   -> 1 × 500 g
-- * The "pcs" measure unit disappears: a number of items is now contentItemCount.

-- Stop rather than lose data the new rules cannot represent.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Product"
    WHERE ("quantityUnit" = 'pcs' AND ("contentQuantity" <> trunc("contentQuantity") OR "contentQuantity" < 2))
       OR ("unit" = 'KG' AND "contentQuantity" IS NOT NULL)
       OR ("unit" = 'BOUTEILLE' AND ("quantityUnit" IS NULL OR "quantityUnit" NOT IN ('ml', 'l')))
  ) THEN
    RAISE EXCEPTION 'Some products cannot be converted to the new content model: fix them before migrating';
  END IF;
END $$;

CREATE TYPE "MeasureUnit" AS ENUM ('g', 'kg', 'ml', 'l');

ALTER TABLE "Product"
  ADD COLUMN "contentItemCount" INTEGER,
  ADD COLUMN "contentAmount" DECIMAL(10,3),
  ADD COLUMN "contentUnit" "MeasureUnit";

UPDATE "Product"
SET "contentItemCount" = "contentQuantity"::INTEGER
WHERE "quantityUnit" = 'pcs';

UPDATE "Product"
SET "contentItemCount" = 1,
    "contentAmount" = "contentQuantity",
    "contentUnit" = "quantityUnit"::TEXT::"MeasureUnit"
WHERE "quantityUnit" <> 'pcs';

-- Recreate ProductUnit: an enum value cannot be removed, and a new one cannot be used in the same transaction.
CREATE TYPE "ProductUnit_new" AS ENUM ('KG', 'BOTTE', 'PIECE', 'DOUZAINE', 'BOUTEILLE', 'LOT');

ALTER TABLE "Product" ALTER COLUMN "unit" DROP DEFAULT;
ALTER TABLE "Product" ALTER COLUMN "unit" TYPE "ProductUnit_new" USING (
  CASE
    WHEN "unit" = 'CONDITIONNEMENT' AND "contentItemCount" = 12 AND "contentAmount" IS NULL THEN 'DOUZAINE'
    WHEN "unit" = 'CONDITIONNEMENT' THEN 'LOT'
    ELSE "unit"::TEXT
  END
)::"ProductUnit_new";
ALTER TABLE "Product" ALTER COLUMN "unit" SET DEFAULT 'KG';

DROP TYPE "ProductUnit";
ALTER TYPE "ProductUnit_new" RENAME TO "ProductUnit";

ALTER TABLE "Product" DROP COLUMN "contentQuantity", DROP COLUMN "quantityUnit";
DROP TYPE "QuantityUnit";
