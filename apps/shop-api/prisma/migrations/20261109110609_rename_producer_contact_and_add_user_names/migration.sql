-- Rattrape le refactor des producteurs (schema.prisma modifié sans migration)
-- et ajoute le nom et le prénom des utilisateurs.

-- Producer : renommage des coordonnées. RENAME conserve les données,
-- contrairement au DROP + ADD généré par Prisma.
ALTER TABLE "Producer" RENAME COLUMN "contactEmail" TO "email";
ALTER TABLE "Producer" RENAME COLUMN "phoneNumber" TO "phone";

-- Customer : le téléphone devient obligatoire sur le profil client.
-- La valeur par défaut ne sert qu'à remplir les lignes existantes, puis elle est retirée.
ALTER TABLE "Customer" ADD COLUMN "phone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Customer" ALTER COLUMN "phone" DROP DEFAULT;

-- User : nom et prénom, même principe.
ALTER TABLE "User" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ALTER COLUMN "firstName" DROP DEFAULT,
ALTER COLUMN "lastName" DROP DEFAULT;

-- Pro : retiré du schéma (profil professionnel des clients).
-- Attention : ses données (companyName, vatNumber, siret) sont supprimées.
ALTER TABLE "Pro" DROP CONSTRAINT "Pro_id_fkey";
DROP TABLE "Pro";
