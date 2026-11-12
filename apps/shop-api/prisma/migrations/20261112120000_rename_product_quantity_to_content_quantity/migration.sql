-- Rename only: the column holds what one sale unit contains (75 cl, 500 g),
-- not to be confused with the quantity ordered in a cart. Existing data is kept.
ALTER TABLE "Product" RENAME COLUMN "quantity" TO "contentQuantity";
