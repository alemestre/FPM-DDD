-- AlterEnum: PENDING is renamed (existing rows keep their meaning) and MODIFIED is added.
ALTER TYPE "OrderStatus" RENAME VALUE 'PENDING' TO 'REGISTERED';
ALTER TYPE "OrderStatus" ADD VALUE 'MODIFIED' AFTER 'IN_PROGRESS';


-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_customerId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "billingAddressLine1" TEXT NOT NULL,
ADD COLUMN     "billingAddressLine2" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "billingCity" TEXT NOT NULL,
ADD COLUMN     "billingPostalCode" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "estimatedPickupDate" DATE NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "number" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'REGISTERED',
ALTER COLUMN "customerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "productName" TEXT NOT NULL,
ADD COLUMN     "vatRate" DECIMAL(5,2) NOT NULL;

-- CreateTable
CREATE TABLE "OrderNumberSequence" (
    "period" TEXT NOT NULL,
    "lastValue" INTEGER NOT NULL,

    CONSTRAINT "OrderNumberSequence_pkey" PRIMARY KEY ("period")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;


