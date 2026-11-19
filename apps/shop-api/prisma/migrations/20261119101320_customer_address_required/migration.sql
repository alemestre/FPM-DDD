/*
  Warnings:

  - Made the column `addressLine1` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `postalCode` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `Customer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "addressLine1" SET NOT NULL,
ALTER COLUMN "postalCode" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL;

-- CreateTable
CREATE TABLE "OrderItem" (
    "uid" SERIAL NOT NULL,
    "productId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("productId","orderId")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_uid_key" ON "OrderItem"("uid");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
