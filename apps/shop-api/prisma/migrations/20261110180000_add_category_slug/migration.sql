-- AlterTable
-- Nullable first so existing categories can be backfilled.
ALTER TABLE "Category" ADD COLUMN "slug" TEXT;

-- Backfill: same rules as the Slug value object (no accents, lowercase,
-- every run of other characters becomes one hyphen, no leading/trailing hyphen).
UPDATE "Category"
SET "slug" = trim(BOTH '-' FROM regexp_replace(
  translate(
    replace(replace(replace(lower("name"), 'œ', 'oe'), 'æ', 'ae'), 'ß', 'ss'),
    'àáâãäåçèéêëìíîïñòóôõöùúûüýÿ',
    'aaaaaaceeeeiiiinooooouuuuyy'
  ),
  '[^a-z0-9]+', '-', 'g'
));

-- A name without any letter or digit gives an empty slug.
UPDATE "Category" SET "slug" = 'categorie-' || "uid" WHERE "slug" = '';

-- Equivalent names ("Fruits", "fruits") give the same slug: suffix all but the oldest.
UPDATE "Category" AS c
SET "slug" = c."slug" || '-' || c."uid"
FROM (
  SELECT "id", row_number() OVER (PARTITION BY "slug" ORDER BY "uid") AS rank
  FROM "Category"
) AS d
WHERE c."id" = d."id" AND d.rank > 1;

ALTER TABLE "Category" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
