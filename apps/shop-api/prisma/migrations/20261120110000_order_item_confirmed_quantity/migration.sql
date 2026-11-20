-- AlterTable: the quantity kept by the shop starts as the quantity ordered, for existing lines too.
ALTER TABLE "OrderItem" ADD COLUMN "confirmedQuantity" INTEGER;
UPDATE "OrderItem" SET "confirmedQuantity" = "quantity";
ALTER TABLE "OrderItem" ALTER COLUMN "confirmedQuantity" SET NOT NULL;
