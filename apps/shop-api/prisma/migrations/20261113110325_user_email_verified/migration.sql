-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "addressLine1" DROP NOT NULL,
ALTER COLUMN "postalCode" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- Accounts created before email verification existed stay able to log in.
UPDATE "User" SET "emailVerified" = true;
