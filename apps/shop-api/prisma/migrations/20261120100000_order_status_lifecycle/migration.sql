-- AlterEnum: REGISTERED becomes PENDING, IN_PROGRESS becomes PREPARING and MODIFIED is dropped.
-- A modified order was already being prepared, so it becomes PREPARING.
-- PostgreSQL cannot drop an enum value, so the type is recreated.
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');

ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING (
    CASE "status"::text
        WHEN 'REGISTERED' THEN 'PENDING'
        WHEN 'IN_PROGRESS' THEN 'PREPARING'
        WHEN 'MODIFIED' THEN 'PREPARING'
        ELSE "status"::text
    END
)::"OrderStatus_new";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';

DROP TYPE "OrderStatus";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
