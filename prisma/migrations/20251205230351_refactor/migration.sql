/*
  Warnings:

  - The values [BEAUTY_SERVICES,CARING,PERSONAL_TRAINING,PRIVATE_CLASSES,VIDEO_AND_PHOTOGRAPHY] on the enum `Category` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `offer` on the `Advert` table. All the data in the column will be lost.
  - You are about to drop the column `viewCount` on the `Advert` table. All the data in the column will be lost.
  - You are about to drop the column `postcode` on the `User` table. All the data in the column will be lost.
  - Added the required column `isOffer` to the `Advert` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Category_new" AS ENUM ('BEAUTY', 'CARE', 'CARPENTRY', 'CLASSES', 'CLEANING', 'ELECTRICIAN', 'GARDENING', 'MEDIA', 'PAINTING', 'PETS', 'PLUMBING', 'REPAIRS', 'RESTORATION', 'TECHNOLOGY', 'TRAINING', 'TRANSPORT');
ALTER TABLE "Advert" ALTER COLUMN "category" TYPE "Category_new" USING ("category"::text::"Category_new");
ALTER TYPE "Category" RENAME TO "Category_old";
ALTER TYPE "Category_new" RENAME TO "Category";
DROP TYPE "public"."Category_old";
COMMIT;

-- AlterTable
ALTER TABLE "Advert" DROP COLUMN "offer",
DROP COLUMN "viewCount",
ADD COLUMN     "isOffer" BOOLEAN NOT NULL,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "postcode",
ADD COLUMN     "postalCode" TEXT;
