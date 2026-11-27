-- Renomme la colonne sans perte de données (Prisma générerait DROP + ADD).
ALTER TABLE "Producer" RENAME COLUMN "tvaNumber" TO "vatNumber";
